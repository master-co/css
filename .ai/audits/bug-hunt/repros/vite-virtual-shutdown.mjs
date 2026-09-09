import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(new URL('../../../../packages/vite/package.json', import.meta.url))
const { createServer } = await import(require.resolve('vite'))
const parent = fileURLToPath(new URL('../../../../packages/vite/tmp/', import.meta.url));mkdirSync(parent, { recursive: true })
const root = mkdtempSync(join(parent, 'virtual-shutdown-'))
console.log(JSON.stringify({ temporaryRoot: root }))
const dependency = process.env.BH_DEPENDENCY === '1', full = process.env.BH_FULL === '1', hot = process.env.BH_HOT !== '0', events = []
let server
try {
  writeFileSync(join(root, 'index.html'), '<!doctype html><div>test</div>')
  mkdirSync(join(root, 'node_modules/audit-dependency'), { recursive: true })
  writeFileSync(join(root, 'node_modules/audit-dependency/package.json'), JSON.stringify({ name: 'audit-dependency', type: 'module', main: 'index.js' }))
  writeFileSync(join(root, 'node_modules/audit-dependency/index.js'), 'export default 1')
  server = await createServer({ root, configFile: false, logLevel: 'silent', plugins: [{ name: 'audit:virtual', resolveId(id) { if (id.startsWith('virtual:')) return '\0' + id }, load(id) {
    if (full && id === '\0virtual:entry') return `import * as MasterCSSRuntime from '${process.env.BH_PACKAGE || '@master/css-runtime'}';import manifest from 'virtual:manifest';import globals from 'virtual:globals';console.log(MasterCSSRuntime,manifest,globals);if(import.meta.hot){import.meta.hot.accept(()=>{});import.meta.hot.accept(['virtual:manifest','virtual:globals'],()=>{});import.meta.hot.dispose(()=>{});}`
    if (full && id.startsWith('\0virtual:')) return 'export default {}'
    if (id === '\0virtual:entry') return `${dependency ? "import dep from 'audit-dependency';console.log(dep);" : ''}import child from 'virtual:child';console.log(child);${hot ? "if (import.meta.hot) import.meta.hot.accept('virtual:child', () => {});" : ''}`
    if (id === '\0virtual:child') return 'export default 1'
  } }], ...(process.env.BH_OPTIMIZER === 'off' ? { optimizeDeps: { noDiscovery: true, include: [] } } : {}), server: { host: '127.0.0.1', port: 0 } })
  await server.listen()
  const response = await fetch(new URL('@id/__x00__virtual:entry', server.resolvedUrls.local[0]));await response.text();events.push({ response: response.status })
  if (process.env.BH_SETTLE === '1') { const optimizer = server.environments.client.depsOptimizer;await optimizer?.scanProcessing;await Promise.all(Object.values(optimizer?.metadata.discovered ?? {}).map(info => info.processing));events.push({ optimizerSettled: true }) }
  if (process.env.BH_DRAIN === '1') await server.environments.client.waitForRequestsIdle()
} finally { await server?.close();rmSync(root, { recursive: true, force: true }) }
console.log(JSON.stringify({ dependency, full, hot, events, observationsFinished: true }))
setTimeout(() => console.log(JSON.stringify({ residualNativeHandles: process.report.getReport().libuv.filter(h => h.is_active && h.is_referenced), resources: process.getActiveResourcesInfo() })), 1000).unref()
