import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack')
const Plugin = (await import(new URL('../../../../packages/webpack/dist/index.js', import.meta.url))).default
const pure = process.env.BH_PURE === '1', memoryCache = process.env.BH_CACHE === '1'
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-optimized-graph-')))
const app = join(root, 'app'), styles = join(root, 'styles')
mkdirSync(app);mkdirSync(styles)
const resource = join(styles, 'pixel.svg'), entry = join(app, 'entry.js')
const svg = '<svg xmlns="http://www.w3.org/2000/svg" id="inactive-resource"/>'
const prefix = pure ? '' : '@master entry;@preserve native;'
writeFileSync(join(styles, 'live.css'), `${prefix}.live{--owner:live}`)
writeFileSync(join(styles, 'dead.css'), `${prefix}.dead{--owner:inactive;background-image:url("./pixel.svg")}`)
writeFileSync(join(styles, 'dead.js'), 'import "./dead.css";export const label="owned";')
writeFileSync(resource, svg)
const js = (stage, active) => `import "../styles/live.css";import{label}from"../styles/dead.js";${active ? 'import "../styles/dead.css";globalThis.activeLabel=label;' : ''}globalThis.auditStage=${JSON.stringify(stage)};`
writeFileSync(entry, js('initial-unused', false))
const plugin = new Plugin({ mode: 'static', runtime: false }, app)
const compiler = webpack({ mode: 'production', context: app, entry: './entry.js', resolve: { tsconfig: false },
  cache: memoryCache ? { type: 'memory' } : false, experiments: { css: true },
  module: { rules: [{ test: /dead\.js$/, sideEffects: false }] },
  output: { path: join(app, 'out'), clean: true, filename: '[name].[contenthash:8].js', cssFilename: '[name].[contenthash:8].css' },
  plugins: pure ? [] : [plugin] })
const events = [], observations = [], listeners = new Set()
let watching, phase = 'initial-unused'
function receive(error, stats) {
  const event = { sequence: events.length, phase,
    errors: error ? [String(error)] : stats?.toJson({ all: false, errors: true }).errors?.map(row => row.message) ?? [],
    assets: stats && !stats.hasErrors() ? Object.fromEntries(stats.compilation.getAssets().map(asset => [asset.name, readFileSync(join(app, 'out', asset.name), 'utf8')])) : {},
    dependencies: stats ? [...stats.compilation.fileDependencies].filter(file => file.startsWith(root)) : [],
    missing: stats ? [...stats.compilation.missingDependencies].filter(file => file.startsWith(root)) : [],
    modules: stats ? [...stats.compilation.modules].filter(module => module.resource?.startsWith(root)).map(module => ({ resource: module.resource, chunks: stats.compilation.chunkGraph.getNumberOfModuleChunks(module) })) : [],
    registered: pure ? undefined : plugin.stylesheets.snapshot().sourceIds }
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
async function step(stage, active, mutate, observeMissing = false) {
  phase = stage
  const after = stage === 'initial-unused' ? 0 : events.length
  mutate?.()
  if (stage !== 'initial-unused') writeFileSync(entry, js(stage, active))
  try {
    const event = await waitFor(after, stage)
    const css = Object.entries(event.assets).filter(([file]) => file.endsWith('.css')).map(([, text]) => text).join('\n')
    const checks = {
      compilationSucceeds: event.errors.length === 0,
      liveCSS: css.includes('--owner:live'),
      inactiveCSSMatchesUsage: css.includes('--owner:inactive') === active,
      inactiveResourceMatchesUsage: Object.values(event.assets).includes(svg) === active
    }
    observations.push({ stage, active, sequence: event.sequence, checks,
      resourceDependency: event.dependencies.includes(resource), missingResource: event.missing.includes(resource),
      errors: event.errors, result: observeMissing ? 'OBSERVED' : Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL' })
  } catch (error) { observations.push({ stage, result: 'FAIL', error: String(error) }) }
  console.log(JSON.stringify({ observation: observations.at(-1) }))
}
try {
  watching = compiler.watch({ aggregateTimeout: 20 }, receive)
  await step('initial-unused', false)
  await step('activate-direct-style', true)
  await step('deactivate-direct-style', false)
  await step('remove-unused-resource', false, () => rmSync(resource), true)
  await step('restore-unused-resource', false, () => writeFileSync(resource, svg))
  await step('reactivate-direct-style', true)
  const summary = { pure, memoryCache, observations, failures: observations.filter(row => row.result === 'FAIL').length,
    scope: 'Actual native production watch with sideEffects:false on the unused JS owner. Missing resource behavior is observed for comparison with pure Webpack, not assumed to be a product defect.' }
  console.log(JSON.stringify({ summary }));if (summary.failures) process.exitCode = 1
} finally {
  if (watching) await new Promise((resolve, reject) => watching.close(error => error ? reject(error) : resolve()))
  await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
  rmSync(root, { recursive: true, force: true })
}
