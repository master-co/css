// node scripts/benchmark-next-static.mjs PATH/TO/dist/static.js OUTPUT.json
// Run each revision separately, with the same release native binding and machine.
import fs from 'node:fs/promises'
import { syncBuiltinESMExports, createRequire } from 'node:module'
import { cpus, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [modulePath, outputPath] = process.argv.slice(2)
if (!modulePath || !outputPath) throw new Error('Expected a built static.js and output JSON path')
const original = { readFile: fs.readFile, open: fs.open, glob: fs.glob }
let metrics, lockStarted
fs.readFile = async function (path, ...args) {
  if (metrics) { metrics.reads++; if (String(path).endsWith('.tsx')) metrics.sourceReads++ }
  return original.readFile.call(this, path, ...args)
}
fs.glob = function (...args) { if (metrics) metrics.globs++; return original.glob.apply(this, args) }
fs.open = async function (file, flags, ...args) {
  const lock = metrics && String(file).endsWith('/publish.lock') && flags === 'wx'
  if (lock && lockStarted === undefined) lockStarted = performance.now()
  const result = await original.open.call(this, file, flags, ...args)
  if (lock) { metrics.lockAcquisitionMs += performance.now() - lockStarted; lockStarted = undefined }
  return result
}
syncBuiltinESMExports()
const moduleURL = pathToFileURL(resolve(modulePath))
const { prepareNextStatic, scanStaticModule } = await import(moduleURL.href)
const require = createRequire(moduleURL)
const { MasterCSSStylesheetCollection } = await import(pathToFileURL(require.resolve('@master/css-compiler/stylesheet')).href)
for (const method of ['register', 'compose']) {
  const original = MasterCSSStylesheetCollection.prototype[method]
  MasterCSSStylesheetCollection.prototype[method] = async function (...args) {
    const active = metrics, start = performance.now()
    if (active) active[`${method}Calls`]++
    try { return await original.apply(this, args) }
    finally { if (active) active[`${method}Ms`] += performance.now() - start }
  }
}
const measure = async operation => {
  metrics = { reads: 0, sourceReads: 0, globs: 0, registerCalls: 0, registerMs: 0, composeCalls: 0, composeMs: 0, lockAcquisitionMs: 0 }
  lockStarted = undefined
  const start = performance.now()
  try { await operation(); return { ...metrics, totalMs: performance.now() - start } }
  finally { metrics = undefined }
}
const dispose = async () => {
  for (const session of globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__?.values() ?? []) {
    await session.scanner.dispose(); session.stylesheets.dispose()
  }
  globalThis.__MASTER_CSS_NEXT_STATIC_SESSIONS__ = new Map()
}
const results = []
const cases = (process.env.MASTER_NEXT_BENCH_CASES ?? 'unchanged,edited,burst').split(',')
if (cases.some(name => !['unchanged', 'edited', 'burst'].includes(name))) throw new Error('Unknown benchmark case')
const sizes = (process.env.MASTER_NEXT_BENCH_SIZES ?? '100,1000,5000').split(',').map(Number)
const rounds = Number(process.env.MASTER_NEXT_BENCH_ROUNDS ?? 15), warmup = 5
for (const size of sizes) {
  const root = await fs.mkdtemp(join(tmpdir(), 'master-next-static-bench-'))
  const samples = Object.fromEntries(cases.map(name => [name, []]))
  try {
    await fs.mkdir(join(root, 'src'))
    await fs.writeFile(join(root, 'app.css'), '@master entry;')
    const files = Array.from({ length: size }, (_, index) => join(root, `src/page-${index}.tsx`))
    await Promise.all(files.map((file, index) => fs.writeFile(file, `<div className="p:${index % 100}px flex"/>`)))
    const state = await prepareNextStatic({}, { projectDir: root })
    for (let round = 0; round < rounds; round++) {
      if (samples.unchanged) {
        const sample = await measure(() => scanStaticModule(state.statePath, files[0], ''))
        if (round >= warmup) samples.unchanged.push(sample)
      }
      if (samples.edited) {
        await fs.writeFile(files[0], `<div className="p:${101 + round * 2}px flex"/>`)
        const sample = await measure(() => scanStaticModule(state.statePath, files[0], ''))
        if (round >= warmup) samples.edited.push(sample)
      }
      if (samples.burst) {
        await fs.writeFile(files[0], `<div className="p:${102 + round * 2}px flex"/>`)
        const sample = await measure(() => Promise.all(Array.from({ length: 10 }, () => scanStaticModule(state.statePath, files[0], ''))))
        if (round >= warmup) samples.burst.push(sample)
      }
    }
    const summary = Object.fromEntries(Object.entries(samples).map(([name, values]) => [name,
      Object.fromEntries(Object.keys(values[0]).map(key => {
        const sorted = values.map(row => row[key]).sort((a, b) => a - b)
        return [key, { median: sorted[Math.floor(sorted.length / 2)], p95: sorted[Math.ceil(sorted.length * 0.95) - 1] }]
      }))]))
    results.push({ size, samples, summary })
    console.log(JSON.stringify({ size, summary }))
  } finally { await dispose(); await fs.rm(root, { recursive: true, force: true }) }
}
await fs.mkdir(dirname(resolve(outputPath)), { recursive: true })
await fs.writeFile(outputPath, JSON.stringify({ version: 1, module: moduleURL.href, node: process.version,
  machine: { platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model }, rounds, warmup, cases,
  notes: ['Warm sessions, tiny TSX files, 100 distinct shared utilities; filesystem growth is isolated from CSS rule count.',
    'Burst sends ten concurrent module notifications for one edit.', 'Instrumentation is included on both sides; lock acquisition includes open latency and contention, not time holding the lock.',
    'These are Master CSS static pipeline calls, not end-to-end Next HMR.'], results }, null, 2) + '\n')
