import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMasterCSSRuntimeBootstrapSource } from '../../../../packages/internal/dist/runtime-bootstrap.js'
import { createMasterCSSVitePlugin } from '../../../../packages/vite/dist/index.js'
import { MasterCSSScanner } from '../../../../packages/tooling/dist/scanner/node.js'
import { MasterCSSServerRenderer } from '../../../../packages/server/dist/create-server-renderer.js'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const events = [], instances = new Map()
const record = (event, data = {}) => events.push({ event, ...data })
for (const [type, prototype, methods] of [['scanner', MasterCSSScanner.prototype, ['init', 'dispose']], ['renderer', MasterCSSServerRenderer.prototype, ['renderHTML', 'dispose']]]) {
  for (const method of methods) {
    const original = prototype[method]
    prototype[method] = function (...args) {
      if (!instances.has(this)) instances.set(this, type + ':' + instances.size)
      record(type + ':' + method, { instance: instances.get(this) })
      return original.apply(this, args)
    }
  }
}
const mode = process.env.BH_MODE || 'progressive', request = process.env.BH_REQUEST || 'css-runtime'
const parent = fileURLToPath(new URL('../../../../packages/vite/tmp/', import.meta.url));mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'shutdown-handles-'))
let server
try {
  writeFileSync(join(root, 'index.html'), '<!doctype html><div class="block"></div>')
  writeFileSync(join(root, 'style.css'), mode.startsWith('pure') ? '.box{color:red}' : '@master entry;')
  const plugins = mode.startsWith('pure') ? (mode === 'pure' ? [] : [{ name: 'audit:pure-runtime', resolveId(id) { if (id.startsWith('virtual:master-css-')) return '\0' + id }, load(id) { if (id === '\0virtual:master-css-runtime') return mode === 'pure-full' ? createMasterCSSRuntimeBootstrapSource() : `import { MasterCSSRuntime } from '@master/css-runtime';console.log(MasterCSSRuntime)`;if (id.startsWith('\0virtual:master-css-')) return 'export default {}' } }]) : createMasterCSSVitePlugin({ mode })
  if (process.env.BH_TRACE === '1') for (const plugin of plugins) for (const key of ['configResolved', 'buildStart', 'closeBundle', 'configureServer', 'handleHotUpdate']) {
    const hook = plugin[key], original = typeof hook === 'function' ? hook : hook?.handler
    if (!original) continue
    const invoke = async function (...args) { record('hook:start', { plugin: plugin.name, hook: key, environment: this?.environment?.name });try { return await original.apply(this, args) } finally { record('hook:end', { plugin: plugin.name, hook: key, environment: this?.environment?.name }) } }
    plugin[key] = typeof hook === 'function' ? invoke : { ...hook, handler: invoke }
  }
  server = await createServer({ root, base: '/base/', configFile: false, logLevel: 'silent', plugins, ...(process.env.BH_OPTIMIZER === 'off' ? { optimizeDeps: { noDiscovery: true, include: [] } } : {}), server: { host: '127.0.0.1', port: 0 } })
  await server.listen();record('listening')
  const routes = { none: [], html: [''], css: ['style.css'], runtime: ['@id/__x00__virtual:master-css-runtime'], 'css-runtime': ['style.css', '@id/__x00__virtual:master-css-runtime'], 'html-css-runtime': ['', 'style.css', '@id/__x00__virtual:master-css-runtime'] }[request]
  for (const route of routes) {
    if (mode === 'pure' && route.includes('virtual:')) continue
    const response = await fetch(new URL(route, server.resolvedUrls.local[0]), { headers: { Accept: route.endsWith('.css') ? 'text/css' : '*/*' } })
    await response.text();record('response', { route, status: response.status })
  }
  if (process.env.BH_SETTLE === '1') { const optimizer = server.environments.client.depsOptimizer;record('optimizer:wait');await optimizer?.scanProcessing;await Promise.all(Object.values(optimizer?.metadata.discovered ?? {}).map(info => info.processing));record('optimizer:done') }
  if (process.env.BH_DRAIN === '1') await server.environments.client.waitForRequestsIdle()
} finally { await server?.close();record('closed');rmSync(root, { recursive: true, force: true }) }
console.log(JSON.stringify({ mode, request, events, observationsFinished: true }))
setTimeout(() => console.log(JSON.stringify({ residualNativeHandles: process.report.getReport().libuv.filter(h => h.is_active && h.is_referenced), resources: process.getActiveResourcesInfo() })), 1000).unref()
