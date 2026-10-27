import { createRequire } from 'node:module'
import { createPostCSSRequestPlugins, type PostCSSPlugin, type PostCSSResourceHook } from './postcss-request-plugins'

interface Context {
  getOptions(): { loader: string, options: Record<string, unknown> }
  callback(error: Error | null, css?: string, map?: object | string, meta?: object): void
}
interface NativePostCSS {
  postcss(plugins: PostCSSPlugin[]): unknown
  postcssWithPlugins: { plugins: PostCSSPlugin[] }
}

/** Preserve host configuration; resource hooks receive a separate processor per request. */
export default function postcssDispatcher(this: Context, css: string, map?: object | string, meta?: {
  masterPostCSSProcessed?: boolean
  masterPostCSSResources?: PostCSSResourceHook
}) {
  if (meta?.masterPostCSSProcessed) return this.callback(null, css, map, meta)
  const options = this.getOptions()
  let delegated = options.options
  if (meta?.masterPostCSSResources) {
    const resources = meta.masterPostCSSResources
    const factory = delegated.postcss
    if (typeof factory !== 'function') throw new TypeError('Native PostCSS factory is required for resource hooks.')
    const original = delegated
    delegated = { ...original, postcss: async (...args: unknown[]) => {
      const configured = await factory.apply(original, args) as NativePostCSS
      return { ...configured, postcssWithPlugins: configured.postcss(createPostCSSRequestPlugins(configured.postcssWithPlugins.plugins, resources)) }
    } }
  }
  const host = Object.create(this) as Context
  host.getOptions = () => delegated as ReturnType<Context['getOptions']>
  const implementation = createRequire(import.meta.url)(options.loader)
  return (implementation.default ?? implementation).call(host, css, map, meta)
}
