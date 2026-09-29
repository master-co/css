// Build both revisions first, then run with other builds idle:
// node --expose-gc scripts/benchmark-mixin-contents.mjs BEFORE_ROOT AFTER_ROOT OUTPUT.json
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { arch, cpus, platform } from 'node:os'

const [beforeRoot, afterRoot, output] = process.argv.slice(2)
if (!output) throw new Error('Expected BEFORE_ROOT AFTER_ROOT OUTPUT.json')
const classes = Array.from({ length: 240 }, (_, i) => `padding:${i}px${i % 3 === 0 ? '@media((width>=50rem))' : ''}`)
classes.push('p-md@media((width>=50rem))', 'padding:8px@media((min-width:50rem))')
const sizes = bytes => ({ raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length, brotli: brotliCompressSync(bytes).length })
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
function load(root) {
  const module = { exports: {} }
  const library = platform() === 'darwin' ? 'libmastercss_binding_native.dylib' : 'libmastercss_binding_native.so'
  process.dlopen(module, resolve(root, 'target/release', library))
  const manifest = readFileSync(resolve(root, 'packages/preset/src/default-manifest.json'), 'utf8')
  return { root, api: module.exports, manifest, samples: {} }
}
const pair = [load(beforeRoot), load(afterRoot)]
function measure(side, name, operation, keep) {
  const start = performance.now()
  operation()
  const elapsed = performance.now() - start
  if (keep) (side.samples[name] ??= []).push(elapsed)
}
for (let round = 0; round < 45; round++) {
  for (const side of round % 2 ? [...pair].reverse() : pair) {
    const keep = round >= 10
    let engine
    measure(side, 'create', () => { engine = new side.api.EngineSession(side.manifest) }, keep)
    measure(side, 'generate242', () => JSON.parse(engine.ensureClassRules(classes)), keep)
    measure(side, 'cache242', () => JSON.parse(engine.ensureClassRules(classes)), keep)
    measure(side, 'deleteInsert242', () => {
      JSON.parse(engine.deleteClassRules(classes))
      JSON.parse(engine.ensureClassRules(classes))
    }, keep)
    engine.dispose()
    const manifest = JSON.parse(side.manifest)
    const current = manifest.languageVersion >= 7
    if (current) manifest.mixins.push({ name: '--bench-hover', body: [
      { type: 'rule', selector: '&:hover', body: [{ type: 'contents', fallback: [] }] }
    ] })
    else manifest.variants.push({ token: '@bench-hover', branches: [{ selector: '&:hover', conditions: [] }] })
    const wrapper = new side.api.EngineSession(JSON.stringify(manifest))
    const wrapped = Array.from({ length: 80 }, (_, i) => `padding:${i}px@${current ? 'apply(--bench-hover)' : 'bench-hover'}`)
    measure(side, 'hoverWrapper80', () => JSON.parse(wrapper.ensureClassRules(wrapped)), keep)
    const snapshot = JSON.parse(wrapper.snapshot())
    if (snapshot.rules.length !== 80 || !snapshot.text.includes(':hover{padding:')) {
      throw new Error('Wrapper benchmark did not execute equivalent selector/declaration work')
    }
    wrapper.dispose()
    const scanner = new side.api.ScannerSession(side.manifest)
    const html = `<div class="${classes.join(' ')}"></div>`
    measure(side, 'scannerFirst242', () => JSON.parse(scanner.scan('app.html', html)), keep)
    measure(side, 'scannerCache242', () => JSON.parse(scanner.scan('app.html', html)), keep)
    scanner.dispose()
  }
}
const results = pair.map(side => ({
  binding: JSON.parse(side.api.bindingInfoJson()),
  samples: side.samples,
  mediansMs: Object.fromEntries(Object.entries(side.samples).map(([key, values]) => [key, median(values)])),
  artifacts: {
    runtimeJS: sizes(readFileSync(resolve(side.root, 'packages/runtime/dist/global.min.js'))),
    engineWasm: sizes(readFileSync(resolve(side.root, 'packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm'))),
    manifest: sizes(Buffer.from(side.manifest))
  }
}))
const report = {
  version: 1, node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0].model,
  rounds: 45, warmup: 10, alternatingOrder: true, bindingProfile: 'release',
  compression: 'individual assets, gzip level 9 and Brotli default',
  before: results[0], after: results[1],
  ratios: Object.fromEntries(Object.keys(results[0].mediansMs).map(key => [key, results[1].mediansMs[key] / results[0].mediansMs[key] - 1]))
}
writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ before: results[0].mediansMs, after: results[1].mediansMs, ratios: report.ratios, artifacts: results.map(result => result.artifacts) }, null, 2))
