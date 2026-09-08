import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

assert(process.cwd().includes('master-css-bh-isolated-'))
const require = createRequire(resolve('package.json'))
const { MasterCSSScanner } = await import(pathToFileURL(require.resolve('@master/css-tooling/scanner/node')).href)
const { default: masterCSS } = await import(pathToFileURL(require.resolve('@master/css-vite')).href)
const { build } = await import(pathToFileURL(require.resolve('vite')).href)
const { prepareStaticWorkspace, staticBuildTools } = await import(pathToFileURL(resolve('shared/static-build.ts')).href)
const { findCSSFiles, readFiles } = await import(pathToFileURL(resolve('shared/runner.ts')).href)
const workspace = resolve('.results/audit-vite-scan-count')
await prepareStaticWorkspace(workspace, 'minimal', staticBuildTools.find(tool => tool.id === 'master-static-vite'))
const hooks = [], scanModules = [], scans = []
const saved = new Map()
for (const method of ['scanModule', 'scan']) {
  const proto = MasterCSSScanner.prototype
  saved.set(method, Object.getOwnPropertyDescriptor(proto, method))
  const original = proto[method]
  proto[method] = async function(source, content) {
    if (method === 'scanModule') scanModules.push({ source, allowed: this.isModuleAllowed(source) })
    else scans.push({ source })
    return original.call(this, source, content)
  }
}
try {
  const plugins = masterCSS({ mode: 'static' }).map(plugin => {
    if (plugin.name !== 'master-css:usage-graph') return plugin
    const next = { ...plugin }
    const transform = plugin.transform
    assert.equal(typeof transform, 'function')
    next.transform = async function(code, id, ...rest) {
      hooks.push({ hook: 'transform', source: id })
      return transform.call(this, code, id, ...rest)
    }
    const html = plugin.transformIndexHtml
    assert.equal(typeof html.handler, 'function')
    next.transformIndexHtml = { ...html, async handler(htmlSource, context) {
      hooks.push({ hook: 'transformIndexHtml', source: context.filename })
      return html.handler.call(this, htmlSource, context)
    } }
    return next
  })
  await build({ root: workspace, configFile: false, logLevel: 'silent', plugins,
    build: { outDir: 'dist', emptyOutDir: true, rollupOptions: { input: 'index.html' } } })
  const files = await findCSSFiles(resolve(workspace, 'dist'))
  const css = await readFiles(files)
  const repo = fileURLToPath(new URL('../../../../', import.meta.url))
  const report = JSON.parse(readFileSync(resolve(repo, '.ai/audits/bug-hunt/evidence/0070-build-report.json'), 'utf8'))
  const artifact = report.artifacts.find(a => a.path.includes('/minimal-master-vite-diagnostic/'))
  const sha256 = createHash('sha256').update(css).digest('hex')
  assert.equal(sha256, artifact.sha256)
  const reportedCount = report.samples.find(s => s.variantId === 'minimal-master-vite-diagnostic' && s.metricId === 'source-file-count').value
  const uniqueScannedFiles = [...new Set(scans.map(x => x.source))]
  assert.equal(hooks.length, reportedCount)
  assert(scans.length > 0 && uniqueScannedFiles.length < hooks.length)
  const result = { reportedCount, hooks, scanModules, scans, uniqueScannedFiles,
    cssBytes: css.length, cssSHA256: sha256, matchesUninstrumented0070: true }
  writeFileSync(resolve(repo, '.ai/audits/bug-hunt/evidence/0072-scan-counts.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
} finally {
  for (const [method, descriptor] of saved) {
    if (descriptor) Object.defineProperty(MasterCSSScanner.prototype, method, descriptor)
    else delete MasterCSSScanner.prototype[method]
  }
}
