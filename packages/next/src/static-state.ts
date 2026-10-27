import { createHash } from 'node:crypto'

interface RegExpTransport { $masterCSSRegExp: 1, source: string, flags: string }
export function serializeStaticOptions(value: unknown): string {
  return JSON.stringify(value, (_key, value: unknown) => value instanceof RegExp
    ? { $masterCSSRegExp: 1, source: value.source, flags: value.flags } satisfies RegExpTransport
    : value)
}
export function deserializeStaticOptions<T>(text: string): T {
  return JSON.parse(text, (_key, value: unknown) => {
    if (value && typeof value === 'object' && '$masterCSSRegExp' in value) {
      const regex = value as RegExpTransport
      if (regex.$masterCSSRegExp !== 1 || typeof regex.source !== 'string' || typeof regex.flags !== 'string') throw new TypeError('Invalid Master CSS RegExp transport. Regenerate the static state.')
      // The constructor validates flags; unsupported flags must not be dropped.
      return new RegExp(regex.source, regex.flags)
    }
    return value
  }) as T
}
export function staticFingerprint(value: unknown): string {
  return createHash('sha256').update(serializeStaticOptions(value)).digest('hex')
}
