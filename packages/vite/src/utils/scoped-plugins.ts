import { AsyncLocalStorage } from 'node:async_hooks'
import type { Plugin, ResolvedConfig } from 'vite'

type Hook = (this: unknown, ...args: unknown[]) => unknown
interface HookObject { handler: Hook }
interface EnvironmentContext { environment?: { getTopLevelConfig(): ResolvedConfig } }

function hookConfig(name: string, receiver: unknown, args: unknown[]): ResolvedConfig | undefined {
  if (name === 'configResolved') return args[0] as ResolvedConfig
  if (name === 'configureServer' || name === 'configurePreviewServer') return (args[0] as { config: ResolvedConfig }).config
  if (name === 'applyToEnvironment') return (args[0] as { getTopLevelConfig(): ResolvedConfig }).getTopLevelConfig()
  if (name === 'handleHotUpdate') return (args[0] as { server?: { config: ResolvedConfig } }).server?.config
  if (name === 'transformIndexHtml') {
    const server = (args[1] as { server?: { config: ResolvedConfig } })?.server
    if (server) return server.config
  }
  return (receiver as EnvironmentContext | undefined)?.environment?.getTopLevelConfig()
}

/** Keep every plugin's closures together within one Vite resolved configuration. */
export function scopePlugins(createPlugins: () => Plugin[]): Plugin[] {
  const invocationConfig = new AsyncLocalStorage<ResolvedConfig>()
  const templates = createPlugins()
  const configurations = new WeakMap<ResolvedConfig, Plugin[]>()
  let initialized = false
  let shared = false
  const forConfig = (config: ResolvedConfig) => {
    let plugins = configurations.get(config)
    if (!plugins) {
      shared ||= initialized
      plugins = initialized ? createPlugins() : templates
      initialized = true
      configurations.set(config, plugins)
    }
    return plugins
  }
  return templates.map((template, index) => {
    const plugin = { ...template } as Plugin & Record<string, unknown>
    for (const [name, hook] of Object.entries(template)) {
      // These run before resolution and must only operate on supplied config/options.
      if (name === 'apply' || name === 'config' || name === 'configEnvironment') continue
      const handler = typeof hook === 'function' ? hook : hook && typeof hook === 'object' && 'handler' in hook ? hook.handler : undefined
      if (typeof handler !== 'function') continue
      const invoke: Hook = function (...args) {
        const config = hookConfig(name, this, args) ?? invocationConfig.getStore()
        // A context-free invocation is only unambiguous for one configuration.
        if (!config && shared) throw new Error(`Master CSS ${name} requires a Vite environment or server when plugins are shared`)
        const owned = (config ? forConfig(config)[index] : template) as Plugin & Record<string, unknown>
        const selected = owned[name] as Hook | HookObject
        return (typeof selected === 'function' ? selected : selected.handler).apply(this, args)
      }
      plugin[name] = typeof hook === 'function' ? invoke : { ...hook, handler: invoke }
    }
    // Preserve consumer hook decorations while providing the config even for
    // Rolldown hooks without this.environment. Async context also covers awaits.
    plugin.applyToEnvironment = async environment => {
      const config = environment.getTopLevelConfig()
      const owned = forConfig(config)[index]
      if (owned.applyToEnvironment) {
        const applied = await owned.applyToEnvironment(environment)
        if (applied !== true) return applied
      }
      const bound = { ...plugin } as Plugin & Record<string, unknown>
      for (const [name, hook] of Object.entries(plugin)) {
        if (name === 'apply' || name === 'applyToEnvironment' || name === 'config' || name === 'configEnvironment') continue
        const handler = typeof hook === 'function' ? hook : hook && typeof hook === 'object' && 'handler' in hook ? hook.handler : undefined
        if (typeof handler !== 'function') continue
        const invoke: Hook = function (...args) { return invocationConfig.run(config, () => handler.apply(this, args)) }
        bound[name] = typeof hook === 'function' ? invoke : { ...(hook as HookObject), handler: invoke }
      }
      return bound
    }
    return plugin
  })
}
