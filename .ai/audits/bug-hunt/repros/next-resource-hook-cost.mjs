// Batch 0250: cost characterization of the owned Next PostCSS resource hook. Runs the real input pitch ->
// dispatcher -> installed Next PostCSS loader chain with N user plugins, hook on/off, two stylesheet sizes,
// and records median wall time. Output: BH_NEXT_HOST_EVIDENCE JSON. Requires MASTER_CSS_NATIVE_BINDING_PATH.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { performance } from 'node:perf_hooks'

const nextDir = resolve(process.env.BH_NEXT_PACKAGE_DIR)
const compilerDir = resolve(process.env.BH_COMPILER_PACKAGE_DIR)
const evidence = resolve(process.env.BH_NEXT_HOST_EVIDENCE)
const iterations = Number(process.env.BH_ITERATIONS || 7)
const { compileRenderedStylesheet, compileStylesheet } = await import(pathToFileURL(join(compilerDir, 'dist/stylesheet/index-public.js')))
const { pitch } = await import(pathToFileURL(join(nextDir, 'dist/stylesheet-input-loader.js')))
const { default: dispatcher } = await import(pathToFileURL(join(nextDir, 'dist/webpack-postcss-loader.js')))
const { protectNextGeneratedGlobals } = await import(pathToFileURL(join(nextDir, 'dist/prepare-global-module.js')))
const { rebasePostCSSResources } = await import(pathToFileURL(join(nextDir, 'dist/postcss-resource-policy.js')))
const require = createRequire(join(nextDir, 'package.json'))
const nextRequire = createRequire(require.resolve('next/package.json'))
const postcss = nextRequire('postcss')
const nativeLoader = require.resolve('next/dist/build/webpack/loaders/postcss-loader/src/index')
const baseManifest = { version: 1, utilities: [] }
const projectDir = mkdtempSync(join(tmpdir(), 'master-next-hook-cost-'))
mkdirSync(join(projectDir, '.master/postcss'), { recursive: true })
const sizes = {
  small: { rules: 20, theme: 10 },
  medium: { rules: 400, theme: 60 }
}
function source({ rules, theme }) {
  const themeVars = Array.from({ length: theme }, (_, i) => `--c${i}:#${(i * 7919 % 0xffffff).toString(16).padStart(6, '0')}`).join(';')
  const body = Array.from({ length: rules }, (_, i) => `.r${i}{color:var(--c${i % theme});padding:${i % 9}px;margin:${i % 5}px}`).join('')
  return `@master entry;@preserve native;@theme{${themeVars};--late-color:#abcdef}${body}`
}
function plugins(count) {
  return Array.from({ length: count }, (_, i) => ({ postcssPlugin: `audit-${i}`, Once(root) { root.walkDecls('padding', decl => { decl.value = decl.value }) ;if (i === 0) root.walkRules('.r0', rule => rule.append({ prop: 'outline-color', value: 'var(--late-color)' })) } }))
}
const trace = { traceChild: () => trace, traceAsyncFn: fn => Promise.resolve().then(fn), traceFn: fn => fn(), setAttribute() {} }
async function run(file, snapshot, userPlugins, withHook) {
  const snapshotFile = join(projectDir, '.master/postcss', Math.random().toString(36).slice(2) + '.json')
  writeFileSync(snapshotFile, JSON.stringify(withHook ? snapshot : { ...snapshot, resources: undefined }))
  const pitched = await new Promise((done, fail) => pitch.call({ resourcePath: file, getOptions: () => ({ snapshot: snapshotFile }), addDependency() {}, callback: (error, css, map, meta) => error ? fail(error) : done([css, map, meta]) }))
  const processor = postcss(userPlugins)
  const options = { postcss: async () => ({ postcss, postcssWithPlugins: processor }) }
  const native = await new Promise((done, fail) => dispatcher.call({ resourcePath: file, context: projectDir, currentTraceSpan: trace, sourceMap: true, getOptions: () => ({ loader: nativeLoader, options }), async: () => (error, css, _map, meta) => error ? fail(error) : done({ css, meta }), addDependency() {}, addBuildDependency() {}, addMissingDependency() {}, addContextDependency() {}, emitWarning() {}, emitFile() {} }, pitched[0], pitched[1], pitched[2]))
  const transferred = JSON.parse(JSON.stringify(native.meta.ast.root.toJSON()))
  return protectNextGeneratedGlobals(file, transferred, true)
}
const report = { iterations, rows: [] }
for (const [size, shape] of Object.entries(sizes)) {
  const file = join(projectDir, `${size}.module.css`)
  const css = source(shape)
  writeFileSync(file, css)
  const resourceFiles = []
  const manifest = await compileRenderedStylesheet(file, css, { baseManifest, projectDir, preserveNativeCSS: true, baseFile: file, delivery: { entryURL: './entry.css', stylesheetURL: id => './' + id + '.css', resourceURL: f => { const url = pathToFileURL(f).href;resourceFiles.push([url, f]);return url }, resolveImport: async () => undefined } })
  const lowered = await compileStylesheet(file, css, { baseManifest: manifest.manifest, projectDir, preserveNativeCSS: true, preserveNativeSource: true, baseFile: file })
  const generatedCSS = rebasePostCSSResources(manifest.generatedCSS, file, resourceFiles)
  const snapshot = { source: lowered.css, sourceMap: lowered.sourceMap, generatedCSS, resources: { file, projectDir, manifest: manifest.manifest, processedGlobals: manifest.emittedGlobals, resourceFiles } }
  for (const count of [0, 1, 2, 4, 8]) for (const withHook of [false, true]) {
    const samples = []
    let lateEmitted = null
    for (let i = 0; i < iterations; i++) {
      const started = performance.now()
      const output = await run(file, snapshot, plugins(count), withHook)
      samples.push(performance.now() - started)
      lateEmitted = /--late-color:/.test(output.source)
    }
    samples.sort((a, b) => a - b)
    report.rows.push({ size, bytes: css.length, plugins: count, hook: withHook, medianMs: Number(samples[Math.floor(samples.length / 2)].toFixed(2)), minMs: Number(samples[0].toFixed(2)), maxMs: Number(samples.at(-1).toFixed(2)), hookRenders: withHook ? count + 3 : 0, lateEmitted })
  }
}
rmSync(projectDir, { recursive: true, force: true })
writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n')
for (const row of report.rows) console.log(JSON.stringify(row))
