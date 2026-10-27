import type { MasterCSSToolingSession } from '@master/css-tooling'

const memoizedMethods = new Set<PropertyKey>([
  'analyzeLintDocument',
  'analyzeLintClassList',
  'tokenizeClassList',
  'decodeHTMLAttribute'
])

/** One facade per SourceCode/settings pair, never shared across autofix passes. */
export function createSourceTooling(getSession: () => MasterCSSToolingSession) {
  const methods = new Map<PropertyKey, (...args: unknown[]) => unknown>()
  const memoizedResults: Map<string, unknown>[] = []
  const session = new Proxy({} as MasterCSSToolingSession, {
    get(_, property) {
      if (!memoizedMethods.has(property)) {
        const session = getSession()
        const value = Reflect.get(session, property, session)
        return typeof value === 'function' ? value.bind(session) : value
      }
      let method = methods.get(property)
      if (!method) {
        const results = new Map<string, unknown>()
        memoizedResults.push(results)
        method = (...args) => {
          const session = getSession()
          // Include all options, raw text and unescape settings. Rust owns the
          // immutable result; caching must not merge different lint policies.
          const key = JSON.stringify(args)
          if (!results.has(key)) results.set(key, Reflect.get(session, property).apply(session, args))
          return results.get(key)
        }
        methods.set(property, method)
      }
      return method
    }
  })
  return {
    session,
    clear() {
      // ESLint/parser objects can outlive their rule visitors. Release potentially
      // large document results as soon as the last rule finishes this source.
      for (const results of memoizedResults) results.clear()
      memoizedResults.length = 0
      methods.clear()
    }
  }
}
