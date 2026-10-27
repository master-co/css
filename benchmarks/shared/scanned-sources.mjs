/** Observe one isolated diagnostic build; scanner eligibility stays product-owned.
 * @param {{ scan(source: string, content: string): Promise<boolean> }} prototype
 * @param {string} root
 * @param {(cwd: string, source: string) => string} normalize
 */
export function installScannedSourceCounter(prototype, root, normalize) {
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'scan')
  if (!descriptor || typeof descriptor.value !== 'function') throw new Error('Missing scanner scan method.')
  const original = descriptor.value
  const marker = Symbol.for('master-css.benchmark.scanned-source-counter')
  if (original[marker]) throw new Error('Source counters require isolated diagnostic builds.')
  /** @type {Set<string>} */
  const files = new Set()
  const normalizedRoot = normalize(root, '')
  let restored = false

  /** @this {{ cwd: string }} @param {string} source @param {string} content */
  async function scan(source, content) {
    const result = await original.call(this, source, content)
    if (content && source && !source.startsWith('\0') && normalize(this.cwd, '') === normalizedRoot) {
      files.add(normalize(this.cwd, source))
    }
    return result
  }

  Object.defineProperty(scan, marker, { value: true })
  Object.defineProperty(prototype, 'scan', { ...descriptor, value: scan })
  return {
    files,
    restore() {
      if (restored) return
      if (prototype.scan !== scan) throw new Error('Scanner observation changed during the diagnostic build.')
      Object.defineProperty(prototype, 'scan', descriptor)
      restored = true
    }
  }
}
