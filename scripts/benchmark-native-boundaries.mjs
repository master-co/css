// Paired release-binding benchmark. Build both revisions before running; keep
// other builds idle. This measures executed work, not model generation quality.
// node --expose-gc scripts/benchmark-native-boundaries.mjs BEFORE_ROOT AFTER_ROOT OUTPUT.json
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { cpus, platform, arch } from 'node:os'

const [beforeRoot, afterRoot, output] = process.argv.slice(2)
if (!output) throw new Error('Expected BEFORE_ROOT AFTER_ROOT OUTPUT.json')
const classes = Array.from({ length: 240 }, (_, index) => `p:${index}px${index % 3 === 0 ? '@media((width>=50rem))' : ''}`)
classes.push('p-md@media((width>=50rem))', 'p:8px@media((min-width:50rem))')
const measure = operation => { const start = performance.now(); operation(); return performance.now() - start }
const sizes = bytes => ({ raw: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length })
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
function load(root) {
  // Load the release library directly so a package build cannot silently select
  // its debug artifact. The same N-API methods and JSON parsing run on both sides.
  const module = { exports: {} }
  const library = platform() === 'darwin' ? 'libmastercss_binding_native.dylib' : 'libmastercss_binding_native.so'
  process.dlopen(module, resolve(root, 'target/release', library))
  const manifest = readFileSync(resolve(root, 'packages/preset/src/default-manifest.json'), 'utf8')
  return { root, api: module.exports, manifest, samples: {} }
}
const pair = [load(beforeRoot), load(afterRoot)]
function record(side, name, operation, keep) {
  const elapsed = measure(operation)
  if (keep) (side.samples[name] ??= []).push(elapsed)
}
for (let round = 0; round < 45; round++) {
  for (const side of round % 2 ? [...pair].reverse() : pair) {
    const keep = round >= 10
    let engine
    record(side, 'create', () => { engine = new side.api.EngineSession(side.manifest) }, keep)
    record(side, 'generate242', () => JSON.parse(engine.ensureClassRules(classes)), keep)
    record(side, 'cache242', () => JSON.parse(engine.ensureClassRules(classes)), keep)
    record(side, 'deleteInsert242', () => { JSON.parse(engine.deleteClassRules(classes)); JSON.parse(engine.ensureClassRules(classes)) }, keep)
    engine.dispose()
    for (const count of [1, 8, 32]) {
      const manifest = JSON.parse(side.manifest)
      manifest.modes = [...manifest.modes, { name: 'probe', branches: Array.from({ length: count }, (_, index) => ({ selector: `.probe-${index}`, conditions: [`@media (width>=${index + 1}rem)`] })) }]
      const instance = new side.api.EngineSession(JSON.stringify(manifest))
      record(side, `modeBranches${count}`, () => JSON.parse(instance.ensureClassRules(classes.slice(0, 80).map(name => `${name}@probe`))), keep)
      instance.dispose()
    }
    const scanner = new side.api.ScannerSession(side.manifest)
    const html = `<div class="${classes.join(' ')}"></div>`
    record(side, 'scannerFirst', () => JSON.parse(scanner.scan('app.html', html)), keep)
    record(side, 'scannerCache', () => JSON.parse(scanner.scan('app.html', html)), keep)
    record(side, 'scannerReplace', () => JSON.parse(scanner.scan('app.html', '<div class="p:7px flex"></div>')), keep)
    record(side, 'scannerClear', () => JSON.parse(scanner.scan('app.html', '')), keep)
    scanner.dispose()
  }
}
const results = pair.map(side => {
  const renderer = new side.api.RenderSession(side.manifest)
  renderer.ensureClasses(classes)
  const rendered = JSON.parse(renderer.snapshot())
  renderer.dispose()
  const artifacts = {
    runtimeJS: sizes(readFileSync(resolve(side.root, 'packages/runtime/dist/global.min.js'))),
    engineWasm: sizes(readFileSync(resolve(side.root, 'packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm'))),
    manifest: sizes(Buffer.from(side.manifest)),
    hydration: sizes(Buffer.from(JSON.stringify(rendered.hydrationManifest)))
  }
  global.gc?.()
  const initialMemory = process.memoryUsage()
  const scanner = new side.api.ScannerSession(side.manifest)
  for (let index = 0; index < 1000; index++) scanner.scan(`page-${index}.html`, `<div class="p:${index}px flex"></div>`)
  global.gc?.()
  const populated = process.memoryUsage()
  for (let index = 0; index < 1000; index++) scanner.scan(`page-${index}.html`, '')
  const stateAfterClearing = JSON.parse(scanner.state())
  scanner.dispose()
  return { binding: JSON.parse(side.api.bindingInfoJson()), samples: side.samples,
    mediansMs: Object.fromEntries(Object.entries(side.samples).map(([name, values]) => [name, median(values)])), artifacts,
    runtimeTotal: Object.fromEntries(['raw', 'gzip', 'brotli'].map(format => [format, Object.values(artifacts).reduce((sum, value) => sum + value[format], 0)])),
    memory1000Sources: { rssDelta: populated.rss - initialMemory.rss, heapDelta: populated.heapUsed - initialMemory.heapUsed, externalDelta: populated.external - initialMemory.external },
    remainingClassesAfterClear: stateAfterClearing.validClasses?.length ?? stateAfterClearing.classNames?.length ?? null,
    css: rendered.cssText ?? rendered.snapshot?.text }
})
const ratios = Object.fromEntries(Object.keys(results[0].mediansMs).map(name => [name, results[1].mediansMs[name] / results[0].mediansMs[name] - 1]))
const report = { version: 1, node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0].model,
  rounds: 45, warmup: 10, alternatingOrder: true, bindingProfile: 'release', compression: 'individual assets; gzip default and Brotli default',
  notes: ['Scanner replacement and clearing include new reference withdrawal work; the old implementation retained contributions.', 'RSS and heap deltas are observations, not isolated allocator guarantees.'],
  before: results[0], after: results[1], ratios }
writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ before: results[0].mediansMs, after: results[1].mediansMs, ratios, payload: results.map(result => result.runtimeTotal) }))
