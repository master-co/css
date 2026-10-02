import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync, brotliCompressSync, constants } from 'node:zlib'

// Usage: node scripts/benchmark-keyframe-resources.js BASELINE_CHECKOUT [OUTPUT]
// Both checkouts must have built runtime JS, engine Wasm and preset artifacts.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const baseline = process.argv[2]
if (!baseline) throw new Error('Pass a built baseline checkout directory.')
const rounds = 7
const sessionsPerRound = 50
const report = {
  environment: { node: process.version, platform: process.platform, arch: process.arch, rounds, sessionsPerRound },
  before: {}, after: {}
}
const sizes = bytes => ({
  raw: bytes.length,
  gzip: gzipSync(bytes, { level: 9 }).length,
  brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
})

function traceResources(module, manifest) {
  const trace = []
  const engine = new module.EngineSession(JSON.stringify(manifest))
  const capture = stage => {
    const { resources } = engine.snapshot()
    trace.push({ stage,
      frames: resources.keyframes.map(frame => ({ name: frame.name, id: frame.id, count: frame.refCount })),
      tokens: resources.variables.length
    })
  }
  try {
    capture('empty')
    engine.ensureClassRules(['animate-fade', 'animation-name:fade'])
    capture('two consumers')
    engine.deleteClassRules(['animate-fade'])
    capture('one consumer')
    engine.deleteClassRules(['animation-name:fade'])
    capture('last removed')
  } finally { engine.free() }
  const preserved = structuredClone(manifest)
  preserved.keyframes.find(frame => frame.name === 'fade').retained = true
  const retained = new module.EngineSession(JSON.stringify(preserved))
  try {
    retained.ensureClassRules(['animate-fade'])
    retained.deleteClassRules(['animate-fade'])
    trace.push({ stage: 'preserve floor', frames: retained.snapshot().resources.keyframes
      .map(frame => ({ name: frame.name, count: frame.refCount })) })
  } finally { retained.free() }
  return trace
}

for (const [label, directory] of [['before', baseline], ['after', root]]) {
  const entry = resolve(directory, 'packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine')
  const module = await import(pathToFileURL(entry + '.js'))
  const bytes = readFileSync(entry + '_bg.wasm')
  const start = performance.now()
  const wasm = module.initSync({ module: bytes })
  const result = report[label]
  result.wasmInitMs = performance.now() - start
  result.emptyMemoryBytes = wasm.memory.buffer.byteLength
  const json = readFileSync(resolve(directory, 'packages/preset/src/default-manifest.json'), 'utf8')
  const manifest = JSON.parse(json)
  result.manifest = sizes(Buffer.from(json))
  result.keyframeMetadata = sizes(Buffer.from(JSON.stringify(manifest.keyframes)))
  result.runtimeJS = sizes(readFileSync(resolve(directory, 'packages/runtime/dist/global.min.js')))
  result.runtimeWasm = sizes(bytes)
  const first = new module.EngineSession(json)
  result.firstSessionMemoryBytes = wasm.memory.buffer.byteLength
  first.free()
  const timings = []
  for (let round = 0; round <= rounds; round++) {
    const start = performance.now()
    for (let index = 0; index < sessionsPerRound; index++) {
      const engine = new module.EngineSession(json)
      engine.free()
    }
    if (round) timings.push((performance.now() - start) / sessionsPerRound)
  }
  timings.sort((a, b) => a - b)
  result.createSessionMedianMs = timings[Math.floor(rounds / 2)]
  result.createSessionRangeMs = [timings[0], timings.at(-1)]
  // Linear-memory capacity is page-granular reserved space, not live heap usage.
  const held = Array.from({ length: sessionsPerRound }, () => new module.EngineSession(json))
  result.fiftySessionsMemoryBytes = wasm.memory.buffer.byteLength
  for (const engine of held) engine.free()
  if (label === 'after') result.trace = traceResources(module, manifest)
}

const json = JSON.stringify(report, null, 2) + '\n'
if (process.argv[3]) writeFileSync(process.argv[3], json)
console.log(json)
