/** Run after cargo xtask build-native --release. Pass the baseline commit as argv[2]. */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { performance } from 'node:perf_hooks'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const binding = require('../packages/binding/artifacts/mastercss.node')
const manifest = readFileSync('packages/preset/src/default-manifest.json', 'utf8')
const bytes = input => ({ raw: Buffer.byteLength(input), gzip: gzipSync(input, { level: 9 }).length, brotli: brotliCompressSync(input).length })
const baseline = execFileSync('git', ['rev-parse', process.argv[2] || 'HEAD'], { encoding: 'utf8' }).trim()
const samples = 40
const scenarios = { none: ['display:block'], one: ['animate-fade'], multiple: ['animate-fade', 'animate-rotate', 'animate-zoom'], dynamic: ['animation-name:var(--external)'] }
const timings = {}
// CLI facade names are part of the native public artifact metadata.
for (const [name, classes] of Object.entries(scenarios)) {
  const cold = [], generate = [], remove = [], warm = []
  let css, frames
  for (let index = 0; index < samples; index++) {
    let start = performance.now()
    const engine = new binding.EngineSession(manifest)
    cold.push(performance.now() - start)
    start = performance.now(); engine.ensureClassRules(classes); generate.push(performance.now() - start)
    const snapshot = JSON.parse(engine.snapshot()); css = snapshot.text; frames = snapshot.resources.keyframes.length
    start = performance.now(); engine.deleteClassRules(classes); remove.push(performance.now() - start)
    start = performance.now(); engine.ensureClassRules(classes); warm.push(performance.now() - start)
    engine.dispose()
  }
  const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
  timings[name] = { css: bytes(css), frames, medianMs: { engineCreation: median(cold), generate: median(generate), remove: median(remove), addAgain: median(warm) } }
}
console.log(JSON.stringify({ samples, node: process.version, platform: process.platform, arch: process.arch, baseline, timingScope: 'Fresh engine sessions with the native addon already loaded; current implementation only, not a process or Wasm startup comparison.', manifest: { before: bytes(execFileSync('git', ['show', `${baseline}:packages/preset/src/default-manifest.json`])), after: bytes(manifest) }, nativeCSS: { before: bytes(execFileSync('git', ['show', `${baseline}:packages/preset/src/default-native.css`])), after: bytes(readFileSync('packages/preset/src/default-native.css')) }, runtime: { budgetBaseline: JSON.parse(readFileSync('.ai/contracts/runtime-bundle-size.json')).artifacts, actual: bytes(readFileSync('packages/runtime/dist/global.min.js')) }, scenarios: timings }, null, 2))
