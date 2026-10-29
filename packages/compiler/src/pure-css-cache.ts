import { createHash } from 'node:crypto'

/** Pure binding values only; filesystem discovery and observation stay outside. */
export class PureCSSCache {
  private readonly values = new Map<string, { value: unknown, bytes: number }>()
  private bytes = 0

  constructor(private readonly budget = 4 * 1024 * 1024, private readonly capacity = 128) { }

  run<T>(operation: string, input: unknown, compute: () => T): T {
    const key = operation + ':' + createHash('sha256').update(JSON.stringify(input)).digest('hex')
    const cached = this.values.get(key)
    if (cached) {
      this.values.delete(key)
      this.values.set(key, cached)
      return structuredClone(cached.value) as T
    }
    const value = compute()
    const bytes = JSON.stringify(value).length * 2
    if (bytes <= this.budget && this.capacity > 0) {
      while (this.bytes + bytes > this.budget || this.values.size >= this.capacity) {
        const oldest = this.values.keys().next().value!
        this.bytes -= this.values.get(oldest)!.bytes
        this.values.delete(oldest)
      }
      this.values.set(key, { value: structuredClone(value), bytes })
      this.bytes += bytes
    }
    return value
  }
}

export const pureCSSCache = new PureCSSCache()
