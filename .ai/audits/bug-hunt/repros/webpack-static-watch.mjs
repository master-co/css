import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, readFileSync, rmSync, unlinkSync, renameSync, realpathSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

const require = createRequire(new URL('../../../../packages/webpack/package.json', import.meta.url))
const webpack = require('webpack')
if (process.env.BH_WATCHPACK_PATCHED) {
  const webpackLoad = createRequire(require.resolve('webpack'))
  const watchpackPath = webpackLoad.resolve('watchpack')
  webpackLoad(watchpackPath)
  webpackLoad.cache[watchpackPath].exports = webpackLoad(process.env.BH_WATCHPACK_PATCHED)
}
const Plugin = (await import(process.env.MASTER_WEBPACK_PLUGIN ? pathToFileURL(resolve(process.env.MASTER_WEBPACK_PLUGIN)).href : new URL('../../../../packages/webpack/dist/index.js', import.meta.url).href)).default
const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-webpack-static-watch-')))
console.log(JSON.stringify({ root }))
const entry = join(root, 'entry.css'), child = join(root, 'child.css'), resource = join(root, 'pixel.svg')
const svg = color => `<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7"><rect width="7" height="7" fill="${color}"/></svg>`
const css = color => `@import "https://external.invalid/font.css";.card{color:${color};background-image:url("./pixel.svg?q=1#mark")}`
const source = file => `@import "./${file}" layer(cards) supports(display:grid);@master entry;@preserve native;`
writeFileSync(join(root, 'entry.js'), 'import "./entry.css"; document.body.dataset.ready="true";')
writeFileSync(entry, source('child.css'));writeFileSync(child, css('red'));writeFileSync(resource, svg('red'))
const initiallyMissing = process.env.BH_INITIAL_MISSING
if (initiallyMissing) unlinkSync(initiallyMissing === 'child' ? child : resource)
const plugin = new Plugin({ mode: 'static', runtime: false }, root)
const compiler = webpack({ mode: 'production', context: root, entry: './entry.js', resolve: { tsconfig: false },
  experiments: { css: true }, output: { path: join(root, 'out'), clean: true, publicPath: '/assets/', filename: 'js/[name].[contenthash:12].js', cssFilename: 'css/[name].[contenthash:12].css' },
  plugins: [plugin] })
const events = [], observations = [], listeners = new Set()
let phase = 'initial', watching, previousCSS, previousAssets
function receive(error, stats) {
  const event = { sequence: events.length, phase, error: error ? String(error) : stats?.hasErrors() ? stats.toString({ all: false, errors: true }) : undefined,
    assets: stats && !stats.hasErrors() ? Object.fromEntries(stats.compilation.getAssets().map(asset => [asset.name, readFileSync(join(root, 'out', asset.name), 'utf8')])) : {},
    files: stats?.compilation.entrypoints.get('main')?.getFiles() ?? [],
    dependencies: stats ? [...stats.compilation.fileDependencies] : [], missingDependencies: stats ? [...stats.compilation.missingDependencies] : [] }
  event.css = event.files.find(file => file.endsWith('.css'))
  event.digest = createHash('sha256').update(JSON.stringify(event.assets)).digest('hex')
  events.push(event)
  console.log(JSON.stringify({ event: { ...event, assets: undefined } }))
  for (const listener of listeners) listener(event)
}
function waitFor(after, predicate, timeout = 12000) {
  const existing = events.slice(after).find(predicate)
  if (existing) return Promise.resolve(existing)
  return new Promise((resolve, reject) => {
    const done = event => { if (event.sequence < after || !predicate(event)) return;clearTimeout(timer);listeners.delete(done);resolve(event) }
    const timer = setTimeout(() => { listeners.delete(done);reject(new Error(`No matching watch result after event ${after}; observed ${events.length - after} callbacks`)) }, timeout)
    listeners.add(done)
  })
}
async function step(name, mutate, color, resourceColor, expectError = false) {
  phase = name
  const after = events.length
  mutate?.()
  try {
    const event = await waitFor(name === 'initial' ? 0 : after, event => expectError ? Boolean(event.error) : !event.error && Object.values(event.assets).some(text => text.includes(name === 'unmanage' ? '--stage:unmanaged' : `color:${color}`)) && (!resourceColor || Object.values(event.assets).includes(svg(resourceColor))))
    if (!expectError) {
      assert(event.css, 'Real entry CSS emitted')
      const currentAssets = Object.fromEntries(Object.entries(event.assets).filter(([file]) => /\.(css|svg)$/.test(file)).sort(([a], [b]) => a.localeCompare(b)))
      if (previousCSS && name !== 'restore-resource') {
        if (name === 'rename-child' && event.css === previousCSS) assert.deepEqual(currentAssets, previousAssets, 'Stable entry hash requires identical complete CSS/resource output')
        else assert.notEqual(event.css, previousCSS, 'Semantic input change must update CSS entry hash')
      }
      previousCSS = event.css;previousAssets = currentAssets
      if (name === 'unmanage') {
        assert(!event.dependencies.includes(resource) && !event.dependencies.includes(join(root, 'renamed.css')), 'Unused graph dependencies must be released')
      }
      if (name !== 'unmanage') {
        assert(event.dependencies.includes(resource), 'Resource retained as a watch dependency')
        assert(event.dependencies.includes(name === 'rename-child' ? join(root, 'renamed.css') : child), 'Child retained as a watch dependency')
      }
    }
    const result = { phase: name, result: 'PASS', expectError, sequence: event.sequence, css: event.css, assets: event.assets,
      dependencies: event.dependencies, error: event.error, ownership: { stylesheets: plugin.stylesheets.snapshot().dependencies, fallbacks: [...plugin.stylesheetDependencyFallbacks], scanner: plugin.scanner.resetDependencies, manifest: plugin.defaultManifestDependencies } }
    observations.push(result);console.log(JSON.stringify({ observation: result }))
  } catch (error) {
    const result = { phase: name, result: 'FAIL', error: String(error), after, callbacks: events.length - after, dependencies: events.at(-1)?.dependencies, ownership: { stylesheets: plugin.stylesheets.snapshot().dependencies, fallbacks: [...plugin.stylesheetDependencyFallbacks], scanner: plugin.scanner.resetDependencies, manifest: plugin.defaultManifestDependencies } }
    observations.push(result);console.log(JSON.stringify({ observation: result }))
  }
}
if (process.env.BH_TRACE_MANIFEST) {
  compiler.hooks.watchRun.tap({ name: 'AuditTrace', stage: -1000 }, c => console.log(JSON.stringify({ watchRun: phase, modified: [...(c.modifiedFiles || [])], removed: [...(c.removedFiles || [])], dependencies: plugin.getResetDependencyPaths() })))
  const original = plugin.createDefaultManifestModule.bind(plugin)
  plugin.createDefaultManifestModule = async () => {
    console.log(JSON.stringify({ manifestStart: phase, source: readFileSync(entry, 'utf8') }))
    try { return await original() }
    finally { console.log(JSON.stringify({ manifestEnd: phase, dependencies: plugin.defaultManifestDependencies })) }
  }
}
try {
  watching = compiler.watch({ aggregateTimeout: 20 }, receive)
  await step('initial', undefined, 'red', 'red', Boolean(initiallyMissing))
  if (initiallyMissing) await step('restore-initial', () => writeFileSync(initiallyMissing === 'child' ? child : resource, initiallyMissing === 'child' ? css('red') : svg('red')), 'red', 'red')
  await step('edit-css', () => writeFileSync(child, css('green')), 'green', 'red')
  await step('edit-resource', () => writeFileSync(resource, svg('blue')), 'green', 'blue')
  await step('remove-resource', () => unlinkSync(resource), undefined, undefined, true)
  await step('restore-resource', () => writeFileSync(resource, svg('orange')), 'green', 'orange')
  await step('remove-child', () => unlinkSync(child), undefined, undefined, true)
  await step('restore-child', () => writeFileSync(child, css('purple')), 'purple', 'orange')
  await step('rename-child', () => { renameSync(child, join(root, 'renamed.css'));writeFileSync(entry, source('renamed.css')) }, 'purple', 'orange')
  await step('unmanage', () => writeFileSync(entry, '.card{--stage:unmanaged;color:cyan}'), 'cyan')
  const summary = { initiallyMissing, observations: observations.length, failures: observations.filter(row => row.result === 'FAIL').length, callbacks: events.length,
    scope: 'Actual Webpack production static compiler.watch with native filesystem events; no manual invalidate, forced polling, dev server/HMR/browser/SSR claim. All output snapshots captured at callbacks.' }
  console.log(JSON.stringify({ summary }));if (summary.failures) process.exitCode = 1
} finally {
  if (watching) await new Promise((resolve, reject) => watching.close(error => error ? reject(error) : resolve()))
  await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
  rmSync(root, { recursive: true, force: true })
}
