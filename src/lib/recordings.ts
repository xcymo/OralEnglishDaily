/**
 * 录音持久化：IndexedDB。
 *
 * 设计：
 * - 元数据与音频字节分表，列表/统计只读元数据，不把全部音频读进内存；
 * - 一条录音的 id = `${taskId}::${stepIndex}`，同一句重录会覆盖旧版本；
 * - 所有 API 都是异步的，失败只 reject，由 UI 降级为「本次可回放、未保存」；
 * - 上线 HTTPS 后依然完全本地，不上传服务器。
 */
import type {
  PersistenceStatus,
  RecordingDraft,
  RecordingMeta,
  RecordingStats,
} from '@/types'

const DB_NAME = 'oral-english-recordings'
const DB_VERSION = 1
const META_STORE = 'recordings'
const BLOB_STORE = 'blobs'

interface StoredBlob {
  id: string
  data: ArrayBuffer
  mimeType: string
}

export class RecordingStorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RecordingStorageError'
  }
}

let dbPromise: Promise<IDBDatabase> | null = null

export function recordingStorageSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  if (!recordingStorageSupported()) {
    return Promise.reject(
      new RecordingStorageError('当前浏览器不支持 IndexedDB，录音无法持久保存'),
    )
  }
  if (dbPromise) return dbPromise
  const next = new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      reject(new RecordingStorageError('无法打开本机录音存储'))
      return
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(META_STORE)) {
        const store = db.createObjectStore(META_STORE, { keyPath: 'id' })
        store.createIndex('createdAt', 'createdAt')
        store.createIndex('taskId', 'taskId')
        store.createIndex('date', 'date')
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => {
        db.close()
        dbPromise = null
      }
      resolve(db)
    }
    request.onerror = () => {
      reject(
        request.error instanceof Error
          ? request.error
          : new RecordingStorageError('打开本机录音存储失败'),
      )
    }
    request.onblocked = () => {
      reject(
        new RecordingStorageError('录音存储正被其他页面占用，关闭其他标签页后重试'),
      )
    }
  })
  dbPromise = next
  // 打开失败时清掉缓存，允许下次操作重试
  next.catch(() => {
    if (dbPromise === next) dbPromise = null
  })
  return next
}

function transactionPromise(
  db: IDBDatabase,
  stores: string[],
  mode: IDBTransactionMode,
  run: (txn: IDBTransaction) => void,
  failureMessage: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let txn: IDBTransaction
    try {
      txn = db.transaction(stores, mode)
    } catch (error) {
      reject(
        error instanceof Error ? error : new RecordingStorageError(failureMessage),
      )
      return
    }
    txn.oncomplete = () => resolve()
    txn.onerror = () => reject(txn.error ?? new RecordingStorageError(failureMessage))
    txn.onabort = () => reject(txn.error ?? new RecordingStorageError(failureMessage))
    try {
      run(txn)
    } catch (error) {
      try {
        txn.abort()
      } catch {
        // ignore
      }
      reject(error instanceof Error ? error : new RecordingStorageError(failureMessage))
    }
  })
}

export async function saveRecording(
  draft: RecordingDraft,
  blob: Blob,
  durationMs: number,
): Promise<RecordingMeta> {
  const data = await blob.arrayBuffer()
  const db = await openDb()
  const meta: RecordingMeta = {
    ...draft,
    createdAt: new Date().toISOString(),
    durationMs: Math.max(0, Math.round(durationMs)),
    mimeType: blob.type || 'audio/webm',
    size: data.byteLength,
  }
  await transactionPromise(
    db,
    [META_STORE, BLOB_STORE],
    'readwrite',
    (txn) => {
      txn.objectStore(META_STORE).put(meta)
      txn.objectStore(BLOB_STORE).put({
        id: meta.id,
        data,
        mimeType: meta.mimeType,
      } satisfies StoredBlob)
    },
    '保存录音失败',
  )
  // 尽量申请「持久存储」，降低被浏览器自动清理的概率；失败不影响保存本身
  void ensurePersistentStorage()
  return meta
}

export async function getRecordingMeta(
  id: string,
): Promise<RecordingMeta | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(META_STORE, 'readonly')
    const request = txn.objectStore(META_STORE).get(id)
    txn.oncomplete = () => resolve((request.result as RecordingMeta) ?? null)
    txn.onerror = () =>
      reject(txn.error ?? new RecordingStorageError('读取录音信息失败'))
    txn.onabort = () =>
      reject(txn.error ?? new RecordingStorageError('读取录音信息失败'))
  })
}

export async function getRecordingBlob(id: string): Promise<Blob | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const txn = db.transaction([META_STORE, BLOB_STORE], 'readonly')
    const metaRequest = txn.objectStore(META_STORE).get(id)
    const blobRequest = txn.objectStore(BLOB_STORE).get(id)
    txn.oncomplete = () => {
      const stored = blobRequest.result as StoredBlob | undefined
      const meta = metaRequest.result as RecordingMeta | undefined
      if (!stored) {
        resolve(null)
        return
      }
      resolve(
        new Blob([stored.data], {
          type: stored.mimeType || meta?.mimeType || 'audio/webm',
        }),
      )
    }
    txn.onerror = () =>
      reject(txn.error ?? new RecordingStorageError('读取录音失败'))
    txn.onabort = () =>
      reject(txn.error ?? new RecordingStorageError('读取录音失败'))
  })
}

export async function listRecordings(limit = 100): Promise<RecordingMeta[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const txn = db.transaction(META_STORE, 'readonly')
    const request = txn.objectStore(META_STORE).getAll()
    txn.oncomplete = () => {
      const all = (request.result ?? []) as RecordingMeta[]
      resolve(
        all
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit),
      )
    }
    txn.onerror = () =>
      reject(txn.error ?? new RecordingStorageError('读取录音列表失败'))
    txn.onabort = () =>
      reject(txn.error ?? new RecordingStorageError('读取录音列表失败'))
  })
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await openDb()
  await transactionPromise(
    db,
    [META_STORE, BLOB_STORE],
    'readwrite',
    (txn) => {
      txn.objectStore(META_STORE).delete(id)
      txn.objectStore(BLOB_STORE).delete(id)
    },
    '删除录音失败',
  )
}

export async function clearRecordings(): Promise<void> {
  const db = await openDb()
  await transactionPromise(
    db,
    [META_STORE, BLOB_STORE],
    'readwrite',
    (txn) => {
      txn.objectStore(META_STORE).clear()
      txn.objectStore(BLOB_STORE).clear()
    },
    '清除录音失败',
  )
}

export async function recordingStats(): Promise<RecordingStats> {
  const items = await listRecordings(100_000)
  return {
    count: items.length,
    bytes: items.reduce((sum, item) => sum + (item.size || 0), 0),
    latestAt: items[0]?.createdAt ?? null,
  }
}

/** 请求浏览器的持久存储权限；不弹框，失败或浏览器不支持时返回对应状态 */
export async function ensurePersistentStorage(): Promise<PersistenceStatus> {
  try {
    if (!navigator.storage) return 'unsupported'
    if (await navigator.storage.persisted?.()) return 'granted'
    if (!navigator.storage.persist) return 'unsupported'
    return (await navigator.storage.persist()) ? 'granted' : 'denied'
  } catch {
    return 'unsupported'
  }
}

export function describeRecordingError(error: unknown): string {
  if (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  ) {
    return '本机存储空间不足，这段录音暂时没能保存。可以去「进度 → 我的录音」或设置里删掉旧录音后重试。'
  }
  if (error instanceof RecordingStorageError) {
    return `${error.message}。这段录音仍可在本次回放，刷新后会丢失。`
  }
  if (error instanceof DOMException && error.name === 'SecurityError') {
    return '浏览器限制了本机存储（可能处于隐私模式）。录音仍可在本次回放，但刷新后会丢失。'
  }
  return '这段录音没能保存到本机，仍可回放，刷新后会丢失。'
}
