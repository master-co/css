export const RETAINED_CLASS_RULE_MIN_AGE_MS = 1000
export const RETAINED_CLASS_RULE_IDLE_TIMEOUT_MS = 5000
export const RETAINED_CLASS_RULE_CLEANUP_BATCH_SIZE = 64
export const RETAINED_CLASS_RULE_SOFT_TARGET = 128
export const RETAINED_CLASS_RULE_HARD_LIMIT = 512
export const RETAINED_CLASS_RULE_HARD_RAW_BYTES = 256 * 1024

export interface RetainedClassRule {
  retainedAt: number
  rawBytes: number
  ruleCount: number
}

export interface RuntimeCleanupWindow {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number
  cancelIdleCallback?: (handle: number) => void
  setTimeout: typeof globalThis.setTimeout
  clearTimeout: typeof globalThis.clearTimeout
}
