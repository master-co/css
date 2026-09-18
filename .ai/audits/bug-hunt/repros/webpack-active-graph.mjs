import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack')
const Plugin = (await import(process.env.MASTER_WEBPACK_PLUGIN
  ? pathToFileURL(resolve(process.env.MASTER_WEBPACK_PLUGIN)).href
  : new URL('../../../../packages/webpack/dist/index.js', import.meta.url).href)).default
const pure = process.env.BH_PURE === '1'
const memoryCache = process.env.BH_CACHE === '1'
const withManifest = process.env.BH_MANIFEST === '1'
const simultaneous = process.env.BH_SIMULTANEOUS
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-active-graph-')))
const app = join(root, 'app'), styles = join(root, 'styles')
mkdirSync(app);mkdirSync(styles)
const entry = join(app, 'entry.js'), stylesheet = join(styles, 'entry.css'), resource = join(styles, 'pixel.svg')
const svg = '<svg xmlns="http://www.w3.org/2000/svg" id="owned-resource"/>'
const css = `${pure ? '' : '@master entry;@preserve native;'} .owned{--owner:removed-module;background-image:url("./pixel.svg")}`
const manifestImport = withManifest ? 'import manifest from "virtual:master-css-manifest";globalThis.auditManifest=manifest;' : ''
const js = (stage, attached) => `${manifestImport}${attached ? 'import "../styles/entry.css";' : ''}globalThis.auditStage=${JSON.stringify(stage)};`
if (withManifest) writeFileSync(join(app, 'global.css'), '@master entry;@preserve native;.global{--global:kept}')
writeFileSync(stylesheet, css);writeFileSync(resource, svg);writeFileSync(entry, js('initial', true))
const plugin = new Plugin({ mode: 'static', runtime: false }, app)
const compiler = webpack({ mode: 'production', context: app, entry: './entry.js', resolve: { tsconfig: false },
  cache: memoryCache ? { type: 'memory' } : false,
  experiments: { css: true }, output: { path: join(app, 'out'), clean: true, filename: '[name].[contenthash:8].js', cssFilename: '[name].[contenthash:8].css' },
  plugins: pure ? [] : [plugin] })
const events = [], observations = [], listeners = new Set()
const compilationModules = new WeakMap()
compiler.hooks.thisCompilation.tap('AuditModuleOwnership', compilation => {
  const trace = { built: [], finished: [] }
  compilationModules.set(compilation, trace)
  compilation.hooks.succeedModule.tap('AuditModuleOwnership', module => {
    if (module.resource?.startsWith(root)) trace.built.push(module.resource)
  })
  compilation.hooks.finishModules.tap('AuditModuleOwnership', modules => {
    trace.finished = [...modules].map(module => module.resource).filter(file => file?.startsWith(root))
  })
})
let watching, phase = 'initial'
const ownership = () => pure ? undefined : {
  sources: plugin.stylesheets.snapshot().sourceIds,
  dependencies: plugin.stylesheets.snapshot().dependencies,
  fallbacks: [...plugin.stylesheetDependencyFallbacks],
  recorded: Object.keys(plugin.moduleContentByPath),
  manifest: plugin.defaultManifestDependencies,
  scanner: plugin.scanner.resetDependencies
}
function receive(error, stats) {
  const event = { sequence: events.length, phase,
    errors: error ? [String(error)] : stats?.toJson({ all: false, errors: true }).errors?.map(row => row.message) ?? [],
    assets: stats && !stats.hasErrors() ? Object.fromEntries(stats.compilation.getAssets().map(asset => [asset.name, readFileSync(join(app, 'out', asset.name), 'utf8')])) : {},
    dependencies: stats ? [...stats.compilation.fileDependencies].filter(file => file.startsWith(root)) : [],
    missing: stats ? [...stats.compilation.missingDependencies].filter(file => file.startsWith(root)) : [],
    modules: stats ? [...stats.compilation.modules].filter(module => module.resource?.startsWith(root)).map(module => ({ resource: module.resource, chunks: stats.compilation.chunkGraph.getNumberOfModuleChunks(module) })) : [],
    moduleLifecycle: stats ? compilationModules.get(stats.compilation) : undefined,
    ownership: ownership() }
  events.push(event);console.log(JSON.stringify({ event }))
  for (const listener of listeners) listener(event)
}
function waitFor(after, stage) {
  const matches = event => event.sequence >= after && (event.errors.length || Object.entries(event.assets).some(([file, source]) => file.endsWith('.js') && source.includes(`auditStage=${JSON.stringify(stage)}`)))
  const existing = events.find(matches)
  if (existing) return Promise.resolve(existing)
  return new Promise((resolve, reject) => {
    const done = event => { if (!matches(event)) return;clearTimeout(timer);listeners.delete(done);resolve(event) }
    const timer = setTimeout(() => { listeners.delete(done);reject(new Error(`No ${stage} callback after ${after}`)) }, 12000)
    listeners.add(done)
  })
}
async function step(stage, attached, mutate) {
  phase = stage
  const after = stage === 'initial' ? 0 : events.length
  mutate?.()
  if (stage !== 'initial') writeFileSync(entry, js(stage, attached))
  try {
    const event = await waitFor(after, stage)
    const output = Object.values(event.assets).join('\n')
    const checks = {
      compilationSucceeds: event.errors.length === 0,
      ownerCSS: output.includes('--owner:removed-module') === attached,
      resourceEmission: Object.values(event.assets).includes(svg) === attached,
      stylesheetDependency: event.dependencies.includes(stylesheet) === attached,
      resourceDependency: event.dependencies.includes(resource) === attached,
      removedResourceNotMissing: attached || !event.missing.includes(resource),
      manifestDiscoveryExcluded: pure || (withManifest
        ? event.ownership.manifest.length === 1 && event.ownership.manifest[0] === join(app, 'global.css') && event.dependencies.includes(join(app, 'global.css'))
        : event.ownership.manifest.length === 0)
    }
    observations.push({ stage, checks, sequence: event.sequence, result: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL' })
  } catch (error) { observations.push({ stage, result: 'FAIL', error: String(error) }) }
  console.log(JSON.stringify({ observation: observations.at(-1) }))
}
try {
  watching = compiler.watch({ aggregateTimeout: 20 }, receive)
  await step('initial', true)
  await step('detached', false)
  await step('unchanged-reattached', true)
  await step('detached-again', false)
  await step('detached-resource-removed', false, () => rmSync(resource))
  await step('detached-resource-restored', false, () => writeFileSync(resource, svg))
  await step('reattached', true)
  if (simultaneous) {
    await step('simultaneous-detach-delete', false, () => {
      if (simultaneous !== 'stylesheet') rmSync(resource)
      if (simultaneous !== 'resource') rmSync(stylesheet)
    })
    await step('restore-unused-files', false, () => { writeFileSync(resource, svg);writeFileSync(stylesheet, css) })
    await step('reattach-restored-files', true)
  }
  const summary = { pure, memoryCache, withManifest, simultaneous, observations, failures: observations.filter(row => row.result === 'FAIL').length,
    scope: 'Actual native Webpack production watch; styles outside discovery root; remove and restore JS import; no forced invalidation or dependency patch' }
  console.log(JSON.stringify({ summary }));if (summary.failures) process.exitCode = 1
} finally {
  if (watching) await new Promise((resolve, reject) => watching.close(error => error ? reject(error) : resolve()))
  await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
  rmSync(root, { recursive: true, force: true })
}
