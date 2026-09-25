// Paired release-binding benchmark with saved baseline artifacts. Keep builds idle.
// node --expose-gc scripts/benchmark-utility-contract.mjs BASELINE_DIRECTORY OUTPUT.json [CURRENT_RELEASE_BINDING]
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { cpus, platform, arch } from 'node:os'

const [baseline, output, currentBinding] = process.argv.slice(2)
if (!output) throw new Error('Expected BASELINE_DIRECTORY OUTPUT.json [CURRENT_RELEASE_BINDING]')
const require = createRequire(import.meta.url)
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
const sizes = bytes => ({ raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length, brotli: brotliCompressSync(bytes).length, sha256: digest(bytes) })
const paths = [
  { binding: resolve(baseline, 'mastercss.node'), manifest: resolve(baseline, 'preset.json'), js: resolve(baseline, 'artifacts/runtime.js'), wasm: resolve(baseline, 'artifacts/engine.wasm'), runtimeManifest: resolve(baseline, 'artifacts/runtime-manifest.json') },
  { binding: resolve(currentBinding ?? 'packages/binding/artifacts/mastercss.node'), manifest: resolve('packages/preset/src/default-manifest.json'), js: resolve('packages/runtime/dist/global.min.js'), wasm: resolve('packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm'), runtimeManifest: resolve('packages/runtime/dist/default-manifest.json') }
]
const pair = paths.map(paths => ({ paths, api: require(paths.binding), manifest: readFileSync(paths.manifest, 'utf8'), samples: {} }))
const classes = Array.from({ length: 240 }, (_, index) => `${index % 2 ? 'size' : 'p'}:${index}px${index % 3 === 0 ? '@media((width>=50rem))' : ''}`)
classes.push('p-md@media((width>=50rem))', 'font-mono', 'text-center:hover', 'fg-red/0.5', 'block:focus-visible')
const measured = (side, name, keep, operation) => {
  const start = performance.now()
  operation()
  if (keep) (side.samples[name] ??= []).push(performance.now() - start)
}
for (let round = 0; round < 45; round++) {
  for (const side of round % 2 ? [...pair].reverse() : pair) {
    const keep = round >= 10
    let engine
    measured(side, 'create', keep, () => { engine = new side.api.EngineSession(side.manifest) })
    measured(side, 'match245', keep, () => { for (const name of classes) JSON.parse(engine.inspect(name)) })
    measured(side, 'generate245', keep, () => JSON.parse(engine.ensureClassRules(classes)))
    measured(side, 'cache245', keep, () => JSON.parse(engine.ensureClassRules(classes)))
    measured(side, 'deleteInsert245', keep, () => { JSON.parse(engine.deleteClassRules(classes)); JSON.parse(engine.ensureClassRules(classes)) })
    engine.dispose()
    for (const count of [1, 8, 32]) {
      const manifest = JSON.parse(side.manifest)
      manifest.modes = [...manifest.modes, { name: 'probe', branches: Array.from({ length: count }, (_, index) => ({ selector: `.probe-${index}`, conditions: [`@media (width>=${index + 1}rem)`] })) }]
      const instance = new side.api.EngineSession(JSON.stringify(manifest))
      measured(side, `modeBranches${count}`, keep, () => JSON.parse(instance.ensureClassRules(classes.slice(0, 80).map(name => `${name}@probe`))))
      instance.dispose()
    }
  }
}
const results = pair.map(side => {
  const renderer = new side.api.RenderSession(side.manifest)
  renderer.ensureClasses(classes)
  const rendered = JSON.parse(renderer.snapshot())
  renderer.dispose()
  const artifacts = {
    runtimeJS: sizes(readFileSync(side.paths.js)), engineWasm: sizes(readFileSync(side.paths.wasm)),
    manifest: sizes(readFileSync(side.paths.runtimeManifest)), hydration: sizes(Buffer.from(JSON.stringify(rendered.hydrationManifest)))
  }
  const statistics = Object.fromEntries(Object.entries(side.samples).map(([name, samples]) => {
    const ordered = [...samples].sort((a, b) => a - b)
    return [name, { medianMs: ordered[Math.floor(ordered.length / 2)], p95Ms: ordered[Math.ceil(ordered.length * .95) - 1] }]
  }))
  return { binding: JSON.parse(side.api.bindingInfoJson()), bindingSha256: digest(readFileSync(side.paths.binding)), samples: side.samples, statistics, artifacts,
    runtimeTotal: Object.fromEntries(['raw', 'gzip', 'brotli'].map(format => [format, Object.values(artifacts).reduce((sum, value) => sum + value[format], 0)])),
    cssDigest: digest(rendered.cssText ?? rendered.snapshot?.text ?? ''), cssBytes: Buffer.byteLength(rendered.cssText ?? rendered.snapshot?.text ?? '') }
})
const ratios = Object.fromEntries(Object.keys(results[0].statistics).map(name => [name, results[1].statistics[name].medianMs / results[0].statistics[name].medianMs - 1]))
const report = { version: 1, baselineHead: readFileSync(resolve(baseline, 'HEAD'), 'utf8').trim(), node: process.version,
  platform: platform(), arch: arch(), cpu: cpus()[0].model, rounds: 45, warmup: 10, alternatingOrder: true, bindingProfile: 'release',
  compression: 'individual delivered assets; gzip level 9 and Brotli defaults', workload: classes,
  before: results[0], after: results[1], ratios }
writeFileSync(output, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ before: results[0].statistics, after: results[1].statistics, ratios, payload: results.map(result => result.runtimeTotal) }))
