# 口语日常 · Say It Daily

一个**纯前端、移动端浏览器优先**的英语口语练习 App。面向英语基础约 5000 词、听得懂七八成、但开口容易卡壳的中文母语者：不背单词，按生活场景练「能直接说出口」的语块和功能句式，每天 10–20 分钟（轻/标准/加强可调），自动安排新学、跟读、替换造句、角色扮演和间隔复习。

无后端、无登录、无数据库。内容全部是本地 JSON，新增场景/句式不需要改任何 React 组件。

---

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173
```

手机真机调试：Vite 已开启 `host: true`，同一个 Wi-Fi 下用手机访问终端里打印的 Network 地址即可。

> 麦克风要求**安全上下文**：`localhost` 或 HTTPS。用局域网 IP 以 `http://` 打开时，Chrome/Safari 会禁止录音，App 会把录音区域降级为提示，练习本身照常进行。需要真机测录音时，可用 `npx vite --host --https`（自签证书）或部署到 HTTPS。

```bash
npm run build      # tsc -b + vite build，产物在 dist/
npm run preview    # 预览生产构建
npm run typecheck  # 只做类型检查
```

技术栈：Vite 6 + React 18 + TypeScript + Tailwind CSS 3 + lucide-react。路由用 `HashRouter`，静态托管到任意目录都不需要服务端 rewrite。

---

## 功能一览

- **今天**：日期、连续打卡、今日进度环、一键开始下一个未完成任务；今日任务为 3–5 个，约 10–20 分钟，加强模式可一次学完 12 个新语块。
- **每日任务生成**：按 `curriculum.ts` 的场景顺序推进新语块，穿插 1 个新句式、1 个跟读/角色扮演、1–2 个间隔复习；同一天刷新任务不变。
- **复习**：1 / 3 / 7 / 14 / 30 天间隔，自评低或标记卡壳的内容优先、且回退到更短间隔。
- **场景库**：40 个场景（A2–C2），按分类、难度、关键词（含语块英中文）筛选；场景详情展示目标语块、可迁移句式、角色扮演脚本。
- **句式库**：80 个功能句式（A2–C2），覆盖 16 类功能，包含协商谈判、礼貌反驳、缓和语气、澄清细微差别、地道习语、职场沟通、投诉补救、讲故事等进阶表达；展示用法、例句、可替换部分。
- **练习**：一次一屏的流程式练习，步骤条 + 分段进度；语块跟读、句式替换、角色扮演、复习回忆、自评；录音/回放、可选语音识别、卡壳记录；退出或刷新不丢步骤，**录音按「任务 + 步骤」持久化在 IndexedDB**，重新进入会自动带出。
- **进度**：连续打卡、累计任务、掌握句式、学完场景、近 7 天柱状图、对齐星期的 5 周热力图、复习队列、我的录音（回放/删除）、不会说清单（单条删除/清空）、最近练习。
- **设置**：轻/标准/加强、跟随系统/浅色/深色、示范语速、录音占用与清除、重置进度、清除全部数据、内容版本与校验状态、如何新增内容。
- **体验**：深色模式、骨架屏、空状态、Toast、错误边界、`prefers-reduced-motion` 降级、底部 safe-area、44px 触控目标、无横向滚动。

## 内容库概览

> 当前内容版本 `2026.11.3`：**40 个场景、452 个语块、80 个功能句式**。全部场景都关联 5 个可迁移句式，所有句式都至少被一个场景引用。

**场景目录（40 个）**

- 工作（9）：会议上礼貌反驳、薪资谈判、项目延期协调、绩效面谈、行为面试、客户提案演示、给同事负面反馈、远程工作边界、办公室闲聊
- 社交（5）：行业活动社交、婚礼祝酒、老友重逢、和朋友约计划、初次约会
- 生活（4）：租房看房、邻里纠纷、找师傅维修、移居海外
- 服务（2）：酒店投诉与补救、退货退款
- 医疗（4）：看医生描述症状、药店咨询、谈压力与情绪、急诊就医
- 金融（2）：银行账户异常、保险理赔
- 教育（2）：家长会、网课讨论
- 科技（2）：技术支持电话、智能家居设置
- 沟通（2）：没听懂请再说一遍、道歉与修复关系
- 出行（5）：问路与找方向、航班取消与改签、行李丢失、租车、海关入境
- 餐饮（2）：咖啡店点单、餐厅投诉
- 安排（1）：打电话改预约

级别分布：C2 1 个、C1 11 个、B2 24 个、B1 1 个、A2 3 个。每个场景 10–12 个语块，角色扮演是完整对话脚本。

**句式分类（16 类，80 个）**

进阶 8 类：协商谈判、礼貌反驳、缓和语气、澄清细微差别、地道习语、职场沟通、投诉与补救、讲故事。  
基础 8 类：没听懂、请求、确认信息、争取时间、绕开不会的词、委婉拒绝、表达观点、寒暄。

**关联与跳转**

- 每个场景固定关联 5 个句式，场景通过 `targetPatterns` 引用全局句式 id；同一个句式可以被多个场景复用。
- 场景详情最下方「可迁移句式」可跳到句式详情；句式详情最下方「去场景里用一用」可跳回引用它的场景。两边都有「全部句式 / 全部场景」入口，找不到关联时也有回退链接。
- 内容加载时会检查孤立内容：某个句式没有任何场景引用、或某个场景没有关联句式，都会在「设置 → 内容 → 校验详情」里给出 warning；当前为 0。

`SCENE_ORDER` 已包含全部 40 个场景，前段是 C1/C2 职场与沟通场景，后段保留 A2/B1 基础场景。内容版本更新后，如果今天的计划还没开始做，会自动换成新计划；已经做过一部分则保留到明天。

---

## 目录结构

```text
.
├── index.html                  # viewport-fit=cover、首屏深色模式、favicon
├── vite.config.ts              # @ 别名、host: true
├── tailwind.config.js          # 颜色/圆角/阴影/动效 token
├── public/favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx                 # 路由、Provider、懒加载、错误边界
    ├── index.css               # 设计 token、safe-area、深色模式、基础样式
    ├── types.ts                # 全量数据模型（内容、任务、进度、复习）
    ├── content/
    │   ├── scenes/*.json       # 场景（含语块、角色扮演）—— 自动加载
    │   ├── patterns/*.json     # 全局功能句式 —— 自动加载
    │   ├── curriculum.ts       # 学习顺序 + 每日任务规则（唯一配置处）
    │   ├── schema.ts           # 手写 schema 校验，中文错误信息
    │   └── index.ts            # import.meta.glob、校验、排序、反查
    ├── lib/
    │   ├── planner.ts          # 每日任务生成、额外练习任务
    │   ├── srs.ts              # 间隔复习
    │   ├── complete.ts         # 完成任务后的状态副作用（纯函数）
    │   ├── practice.ts         # 从任务推导练习步骤
    │   ├── storage.ts          # localStorage 读写与容错合并
    │   ├── recordings.ts       # IndexedDB 录音持久化（元数据/音频分表）
    │   ├── format.ts           # 录音体积、时长格式化
    │   ├── date.ts             # 本地时区日期工具（避免 UTC 偏移）
    │   ├── tts.ts              # 示范朗读，失败静默降级
    │   ├── match.ts            # 可选的语音识别匹配度
    │   └── cn.ts
    ├── hooks/
    │   ├── useRecorder.ts      # MediaRecorder，权限失败不抛错、录完即回调
    │   ├── useSpeechRecognition.ts
    │   ├── useToday.ts         # 跨零点自动换日
    │   └── useTheme.ts
    ├── store/
    │   ├── progress.tsx        # 进度上下文、计划生成、持久化
    │   ├── recordingContext.tsx # 当前任务/步骤的录音上下文
    │   └── toast.tsx
    ├── components/
    │   ├── AppShell.tsx / BottomNav.tsx / PageHeader.tsx
    │   ├── Button.tsx / Card.tsx / Chip.tsx / Sheet.tsx
    │   ├── ProgressRing.tsx / Charts.tsx / Skeleton.tsx
    │   ├── TaskBits.tsx / SceneCard.tsx / PatternCard.tsx / PatternText.tsx
    │   ├── RecordWidget.tsx   # 录音/回放/识别/写入 IndexedDB
    │   ├── RecordingsPanel.tsx # 进度页录音列表、回放、删除
    │   ├── StuckNotesPanel.tsx  # 不会说清单查看、单条删除、清空
    │   ├── SpeakButton.tsx / RatingPicker.tsx
    │   ├── PracticeSteps.tsx   # 各类练习步骤视图
    │   ├── Celebration.tsx / ErrorBoundary.tsx
    └── pages/
        ├── TodayPage.tsx / ScenesPage.tsx / SceneDetailPage.tsx
        ├── PatternsPage.tsx / PatternDetailPage.tsx
        ├── PracticePage.tsx / ProgressPage.tsx / SettingsPage.tsx
        └── NotFoundPage.tsx
```

---

## 内容与组件如何解耦

1. `src/content/index.ts` 用 `import.meta.glob('./scenes/*.json')` 和 `import.meta.glob('./patterns/*.json')` **eager 自动加载**所有 JSON。
2. 每个文件先过 `schema.ts` 校验，再统一排序、建索引（`sceneMap` / `patternMap` / `chunkMap`）、做引用完整性检查。
3. 页面只消费标准化后的 `Scene` / `Pattern`，不读文件名，不写死任何场景 id、顺序或每日规则。
4. 每日任务规则只在 `curriculum.ts` + `lib/planner.ts`。改页面样式不会影响课程逻辑，改内容不需要碰组件。
5. 场景 ↔ 句式双向关联：场景的 `targetPatterns` 引用句式 id；句式详情用 `scenesUsingPattern()` 反查场景；加载时自动检查孤立内容并在设置页展示。

内容出错时：开发环境控制台会打印 `文件 → 字段：中文原因`；「设置 → 内容 → 校验详情」也能看到错误/提醒。错误的场景会被跳过，不会导致白屏。

---

## 如何新增一个场景

**只需要新增一个 JSON 文件**：`src/content/scenes/your-scene.json`。保存后（开发环境会自动热更新，必要时刷新页面）它会自动出现在场景库；如果还没被学完，也会自动进入后续的每日课程。

最小结构：

```json
{
  "id": "hotel-check-in",
  "titleZh": "酒店入住",
  "titleEn": "Checking In at a Hotel",
  "category": "出行",
  "level": "A2",
  "description": "从出示预订到问早餐时间，把前台对话练顺。",
  "coverEmoji": "🏨",
  "tags": ["出行", "酒店", "高频"],
  "estimatedMinutes": 11,
  "order": 5,
  "targetChunks": [
    {
      "id": "hotel-01",
      "en": "Hi, I have a reservation under Wang.",
      "zh": "你好，我用王的名字订了房。",
      "note": "under + 姓氏，是报预订的固定说法。",
      "exampleEn": "— Hi, I have a reservation under Wang. — Let me check.",
      "exampleZh": "——你好，我用王的名字订了房。——我查一下。",
      "tags": ["入住", "预订"]
    }
  ],
  "targetPatterns": ["req-could-you", "conf-just-to-confirm"],
  "roleplay": {
    "promptZh": "你在酒店前台办理入住，确认房型和早餐时间。",
    "promptEn": "Check in at a hotel and confirm your room type and breakfast time.",
    "goals": ["报出预订名字", "确认房型和早餐时间"],
    "script": [
      { "speaker": "staff", "en": "Good evening. Do you have a reservation?", "zh": "晚上好，您有预订吗？" },
      { "speaker": "you", "en": "Yes, under Wang. Could I check the room type?", "zh": "有，姓王。能帮我确认一下房型吗？" }
    ]
  }
}
```

字段速查：

| 字段 | 说明 |
| --- | --- |
| `id` | 全局唯一，小写字母/数字/连字符。**不要和已有场景重复** |
| `category` | 场景分类，例如 沟通 / 餐饮 / 出行 / 安排 / 社交 / 工作 |
| `level` | `A2` / `B1` / `B2` / `C1` / `C2`（C2 目前用于高阶句式） |
| `order` | 同一排序位置下的次级顺序；未写进 `SCENE_ORDER` 的场景排在有序列场景之后 |
| `targetChunks` | 至少 10 个高频语块；`id` 建议带场景前缀并全局唯一（`hotel-01`） |
| `targetPatterns` | 引用 `patterns/*.json` 里的句式 `id`，可复用同一个句式到多个场景 |
| `roleplay.script[].speaker` | `staff` / `you` / `other`；`you` 的台词会在练习页先隐藏中文提示、点开看英文 |
| `roleplay.goals` | 本次角色扮演要达成的 2–4 个小目标 |
| `estimatedMinutes` | 展示用；实际练习时长会按步骤重新估算 |

**调整课程位置**：把 `id` 加进 `src/content/curriculum.ts` 的 `SCENE_ORDER` 即可。不加也行，会自动排在已列场景之后。

---

## 如何新增一个句式

在 `src/content/patterns/` 下任意 JSON 文件里追加一项（文件内容必须是数组，或 `{ "patterns": [...] }`）：

```json
{
  "id": "req-can-i-borrow",
  "functionCategory": "request",
  "patternEn": "Can I borrow [your charger]?",
  "patternZh": "能借一下……吗？",
  "usageNote": "熟人之间的轻量请求；正式场合换成 Could I。",
  "examples": [
    { "en": "Can I borrow your charger for a minute?", "zh": "能借你充电器用一下吗？" },
    { "en": "Can I borrow a pen?", "zh": "能借支笔吗？" }
  ],
  "substitutions": [
    { "zh": "你的充电器", "en": "your charger" },
    { "zh": "一把伞", "en": "an umbrella" }
  ],
  "level": "A2",
  "tags": ["请求", "口语"]
}
```

- `patternEn` 用 `[方括号]` 标出可替换部分，练习页会高亮；替换造句时用 `substitutions[].en` 填入。
- `functionCategory` 必须是 `curriculum.ts` 中 `FUNCTION_CATEGORIES` 的 key（新增分类同时在那里加一项，筛选和教学顺序会自动更新）。
- 要让某个场景用上它，把句式 `id` 写进场景的 `targetPatterns`。
- 句式是全局资源，修改一处会同步到所有引用它的场景。

---

## 如何调整每日任务规则

全部集中在 `src/content/curriculum.ts`：

| 配置 | 作用 |
| --- | --- |
| `DAILY_LOADS.light/standard/intense` | `chunkLimit` 每天新语块上限、`patternCount` 新句式数、`reviewCount` 复习任务数、`estimate` 展示时长 |
| `REVIEW_INTERVALS` | 间隔复习档位，默认 `[1, 3, 7, 14, 30]` 天 |
| `LOW_RATING_THRESHOLD` | 自评低于等于该值时复习回退（默认 2） |
| `MASTERY_ATTEMPTS` / `MASTERY_RATING` | 判定「掌握句式」的练习次数与最近自评门槛 |
| `SCENE_ORDER` | 场景教学顺序；未列出的自动排在后面 |
| `SHADOW_FIRST_DAYS` | 前几天优先安排跟读，之后与角色扮演隔天交替 |
| `FUNCTION_CATEGORIES` | 句式功能分类、展示顺序、emoji |
| `SCENE_CATEGORY_ORDER` | 场景分类筛选的展示顺序 |

每日任务生成逻辑在 `src/lib/planner.ts`，顺序是：新语块 → 新句式 → 跟读/角色扮演 → 复习；当天没有可复习内容时会生成一次「巩固」任务，保证每天 3–5 个任务。

> 修改学习量时：如果今天的任务还没开始，会立即按新节奏重排；已经开始则保留当天计划，从明天生效。因此同一天刷新不会让任务乱变。

---

## 数据与隐私

- **学习进度**：localStorage 键 `oral-english.progress.v1`，包含计划、已学语块/句式、复习队列、打卡、活动热力、卡壳记录、会话步骤、设置。
- **录音**：浏览器 IndexedDB 数据库 `oral-english-recordings`（v1）。`recordings` 表存元数据（任务、步骤、英文文本、时长、大小、时间），`blobs` 表存 ArrayBuffer 音频，列表/统计只读元数据。
- 没有账号、服务器和埋点；录音不会上传。
- 清除路径：设置 →「练习录音」（只清录音）/「重置学习进度」/「清除全部本地数据」。重置和清除全部都会同步清空录音；清除浏览器站点数据也会一并删除。
- 每次保存成功后会调用 `navigator.storage.persist()` 申请持久存储（浏览器不一定会授予），降低被自动回收的概率；设置页会显示是否已申请到。
- **语音识别是可选增强**：Chrome/Edge 的 Web Speech API 可能把音频发送到浏览器厂商的识别服务。不需要识别时不要点「识别检查」；不支持时只显示提示，不阻塞练习。
- 示范朗读使用浏览器 `speechSynthesis`，语速在设置里调；不可用时隐藏/禁用播放按钮。

### 上线到 HTTPS

- `npm run build` 后把 `dist/` 丢到任意静态托管（Nginx / Vercel / Netlify / Cloudflare Pages 等）。使用 `HashRouter`，不需要服务端 rewrite。
- HTTPS 是安全上下文，`MediaRecorder` 和 `IndexedDB` 的能力与 localhost 一致，代码不用改；麦克风权限提示会按正式域名重新询问一次。
- **数据和 origin 绑定**：录音与进度按「协议 + 域名 + 端口」隔离。上线前最好先定好最终域名，换域名等于新站点，旧录音不会自动迁移。
- 每次保存成功后 App 会调用 `navigator.storage.persist()` 申请持久存储，但浏览器（尤其是 iOS Safari）仍可能在长期不访问后回收站点数据。重要录音建议后续加导出/云同步，或至少把 App 添加到主屏幕并定期打开。

### 录音持久化细节

- 一条录音对应「任务 + 步骤」，id 为 `${taskId}::${stepIndex}`；同一句重录会覆盖旧版本，不会无限增长。
- 录完自动异步写入 IndexedDB，先显示可回放状态再显示「已保存在本机」；写入失败（空间不足、隐私模式、浏览器限制）不会阻塞练习，会给出中文提示和「再试一次保存」。
- 退出练习或刷新后，再进入同一步骤会自动读出上次录音，可直接回放，也可重录覆盖。
- 进度页「我的录音」按最近录制排序，可回放、单条删除；设置页显示录音条数与占用，并可一次清空全部。
- 重置学习进度 / 清除全部数据会同时清理录音，避免旧录音串到重置后的新计划里。
- iOS Safari 的 MediaRecorder 输出 mp4，存储时统一转成 ArrayBuffer，回放时按原始 MIME 重建 Blob。

浏览器支持：

| 能力 | 说明 |
| --- | --- |
| 核心练习 | 所有现代浏览器 |
| MediaRecorder | Chrome/Edge/Firefox/Android Chrome/iOS Safari 14.5+；需要 HTTPS 或 localhost |
| IndexedDB | 所有现代浏览器；隐私模式/站点数据限制下可能不可写，App 会自动降级 |
| Web Speech 识别 | Chrome/Edge 及部分 Android 浏览器；Safari 支持不稳定；失败会提示并可跳过 |
| speechSynthesis | 大多数桌面与移动浏览器；音色取决于系统 |

---

## 验收自检

1. **六个页面在手机宽度可用**：已在 390×844 视口逐页跑通（首页、场景、句式、练习、进度、设置），无横向溢出。
2. **今日任务稳定、刷新不丢**：计划按日期持久化；实测完成任务 → 刷新，`completedTaskIds`、计划任务 id、学习进度、复习项均保持；同一天任务 id 不变。
3. **新增场景 JSON 即生效**：`import.meta.glob` 自动加载；无需改组件（详见上方新增场景）。
4. **录音失败可跳过、录音持久化**：权限拒绝/不支持时只展示提示，底部「下一步」始终可用；IndexedDB 每步自动落盘，刷新或退出后重新进入同一步骤会恢复上次录音，可在进度页回放/删除、在设置页清空；Web Speech 不支持时显示降级说明。
5. **深色模式 / 空状态 / Toast / 返回不丢进度**：均实现；练习步骤每步写入 `sessions`，重新进入会回到上次步骤；不会说清单支持单条删除与清空，刷新后状态保持。
6. **无横向滚动、底部导航不遮挡、触控 ≥44px**：`overflow-x: hidden` + 520px 容器；内容区 `pb-nav` / `pb-action` 预留导航与固定操作栏高度；按钮/筛选/评分最小 44px。
7. **结构与扩展性**：40 场景 / 80 句式全部可扩展，内容、课程规则、任务生成、SRS、状态副作用均已分层；场景与句式双向跳转、孤立内容检查已接入；README 提供三条扩展路径。

已知取舍：无 PWA/Service Worker（避免影响核心流程）；录音只在本机，不跨设备同步，清除站点数据会删除；`HashRouter` 换来任意静态托管的兼容性。上线 HTTPS 不需要改代码，录音与 IndexedDB 在安全上下文中行为一致。

---

## 设计 token

`src/index.css` 的 `:root` / `.dark` 定义了颜色（背景、卡片、描边、文字、品牌色、语义色、`--on-brand` 前景）、`--ease-soft`、`--dur-*`。Tailwind 在 `tailwind.config.js` 里把这些变量映射为 `bg-bg`、`text-ink`、`bg-brand`、`border-line` 等；卡片圆角 20px，按钮 12px，Pill 999px。深色模式通过 `<html class="dark">` 切换，首屏在 `index.html` 内联脚本里提前应用，避免白闪。
