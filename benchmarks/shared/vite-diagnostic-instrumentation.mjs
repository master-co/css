/** Decorate the owned factory objects so environment closures keep the wrappers.
 * @template {{ name?: string, [key: string]: unknown }} T
 * @param {T[]} plugins
 * @param {(metricId: string, callback: () => unknown) => Promise<unknown>} time
 * @returns {T[]}
 */
export function instrumentMasterVitePlugins(plugins, time) {
  for (const plugin of plugins) {
    if (plugin.name === 'master-css:scanner') wrap(plugin, 'configResolved', 'vite-master-scanner-init-ms')
    if (plugin.name === 'master-css:usage-graph') {
      wrap(plugin, 'transform', 'vite-master-module-scan-ms')
      wrap(plugin, 'transformIndexHtml', 'vite-master-html-scan-ms')
    }
    if (plugin.name === 'master-css:style-entry') {
      wrap(plugin, 'load', 'vite-master-style-entry-ms')
      wrap(plugin, 'transform', 'vite-master-style-entry-ms')
    }
    if (plugin.name === 'master-css:style-entry:build') wrap(plugin, 'generateBundle', 'vite-master-generate-bundle-ms')
  }
  return plugins

  /** @param {{ [key: string]: unknown }} plugin @param {string} name @param {string} metricId */
  function wrap(plugin, name, metricId) {
    const hook = plugin[name]
    const object = hook && typeof hook === 'object' ? /** @type {Record<string, unknown>} */ (hook) : undefined
    const handler = typeof hook === 'function' ? hook : object?.handler
    if (typeof handler !== 'function') return
    const invoke = handler
    /** @this {unknown} @param {unknown[]} args */
    async function wrapped(...args) {
      return time(metricId, () => invoke.apply(this, args))
    }
    plugin[name] = object ? { ...object, handler: wrapped } : wrapped
  }
}
