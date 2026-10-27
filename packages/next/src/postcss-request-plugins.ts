type Callback = (this: unknown, ...args: unknown[]) => unknown
export type PostCSSPlugin = Record<string, unknown> | Callback
interface PostCSSResult { lastPlugin?: PostCSSPlugin }
export interface PostCSSHookContext {
  result: PostCSSResult
  phase: 'Once' | 'RootExit' | 'OnceExit' | 'function'
}
export type PostCSSResourceHook = (root: unknown, context: PostCSSHookContext) => void | Promise<void>

/** Adapt normalized host plugins without editing its cached processor or plugins. */
export function createPostCSSRequestPlugins(plugins: readonly PostCSSPlugin[], after: PostCSSResourceHook): PostCSSPlugin[] {
  const bridge: Record<string, unknown> = { postcssPlugin: 'master-css-resources' }
  async function finish(root: unknown, result: PostCSSResult, phase: PostCSSHookContext['phase']) {
    const previous = result.lastPlugin
    result.lastPlugin = bridge
    // Keep the resource owner as lastPlugin on failure for native error attribution.
    // Visitor callbacks receive proxies; resource ownership needs stable AST identity.
    const node = (root as { proxyOf?: unknown }).proxyOf ?? root
    await after(node, { result, phase })
    result.lastPlugin = previous
  }
  function wrapHooks(plugin: Record<string, unknown>) {
    const wrapped = { ...plugin }
    function wrap(callback: Callback, phase: string) {
      const invoke = function(this: unknown, node: unknown, helpers: { result: PostCSSResult }) {
        helpers.result.lastPlugin = plugin
        return callback.call(phase === 'Once' ? plugin : this, node, helpers)
      }
      if (phase !== 'Once' && phase !== 'RootExit' && phase !== 'OnceExit') return invoke
      return async function(this: unknown, root: unknown, helpers: { result: PostCSSResult }) {
        await invoke.call(this, root, helpers)
        await finish(root, helpers.result, phase)
      }
    }
    for (const [phase, visitor] of Object.entries(plugin)) {
      if (!/^[A-Z]/.test(phase)) continue
      if (typeof visitor === 'function') wrapped[phase] = wrap(visitor as Callback, phase)
      else if (visitor && typeof visitor === 'object') {
        wrapped[phase] = Object.fromEntries(Object.entries(visitor).map(([filter, callback]) => [
          filter, typeof callback === 'function' ? wrap(callback as Callback, phase) : callback
        ]))
      }
    }
    return wrapped
  }
  const adapted = plugins.map(plugin => {
    if (typeof plugin === 'function') {
      return async function(this: unknown, root: unknown, result: PostCSSResult) {
        result.lastPlugin = plugin
        await plugin.call(this, root, result)
        await finish(root, result, 'function')
      } as Callback
    }
    const wrapped = wrapHooks(plugin)
    if (typeof plugin.prepare === 'function') {
      const prepare = plugin.prepare as Callback
      wrapped.prepare = (result: PostCSSResult) => {
        const prepared = { ...plugin, ...prepare.call(plugin, result) as object }
        return wrapHooks(prepared)
      }
    }
    return wrapped
  })
  for (const phase of ['Once', 'RootExit', 'OnceExit'] as const) {
    bridge[phase] = (root: unknown, helpers: { result: PostCSSResult }) => finish(root, helpers.result, phase)
  }
  return [...adapted, bridge]
}
