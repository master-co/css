import type { MasterCSSToolingBackendSession } from './broker-tooling-contract'
import { callBackend } from './normalize-error'

function sourceText(args: readonly unknown[]) {
  for (const value of args) {
    if (!value || typeof value !== 'object') continue
    if ('content' in value && typeof value.content === 'string') return value.content
    if ('text' in value && typeof value.text === 'string') return value.text
  }
}

export function protectToolingSession<T extends MasterCSSToolingBackendSession>(
  session: T
): T {
  const protectedSession = Object.create(Object.getPrototypeOf(session)) as T
  for (const property of Reflect.ownKeys(session)) {
    const value = Reflect.get(session, property)
    Object.defineProperty(protectedSession, property, {
      configurable: false,
      enumerable: Object.prototype.propertyIsEnumerable.call(session, property),
      writable: false,
      value: typeof value === 'function'
        ? (...args: unknown[]) => callBackend(
          'tooling',
          () => Reflect.apply(value, session, args),
          sourceText(args)
        )
        : value
    })
  }
  return Object.freeze(protectedSession)
}
