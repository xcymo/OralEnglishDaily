/** 极简 className 合并，避免引入 clsx 依赖 */
export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(' ')
}
