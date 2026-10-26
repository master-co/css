import assert from 'node:assert/strict'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Rolldown } from 'tsdown'

const baselinePath = path.resolve('.ai/contracts/runtime-bundle-size.json')
const artifactPaths = [
  'packages/runtime/dist/global.min.js',
  'packages/runtime/artifacts/mastercss_binding_wasm_engine_bg.wasm'
]
// Bundler apps load the browser build from the binding package; the CDN bundle and
// the release asset load the copy staged into the runtime package.
const bundlerRuntimeWasmPath = 'packages/binding-wasm-engine/artifacts/runtime/mastercss_binding_wasm_engine_bg.wasm'
const runtimeEntryPath = 'packages/runtime/dist/index.js'
// What an app bundler ships before a progressive page needs the engine.
const progressiveCriticalPath = `${runtimeEntryPath} (progressive critical path)`

/** Bundles the runtime ESM entry the way an app does, leaving out the lazily imported engine. */
async function bundleProgressiveCriticalPath() {
  const bundle = await Rolldown.rolldown({
    input: runtimeEntryPath,
    platform: 'browser',
    external: ['@master/css'],
    transform: { define: { 'process.env.NODE_ENV': '"production"' } },
    logLevel: 'silent'
  })
  try {
    const { output } = await bundle.generate({ format: 'esm', minify: true })
    const chunks = output.filter(chunk => chunk.type === 'chunk')
    assert.equal(chunks.length, 1, 'The progressive runtime entry must not split before the engine import.')
    assert.match(chunks[0].code, /import\(`@master\/css`\)/, 'The runtime must import @master/css lazily.')
    return Buffer.from(chunks[0].code)
  } finally {
    await bundle.close()
  }
}

function measure(source) {
  return {
    raw: source.byteLength,
    gzip: gzipSync(source, { level: 9 }).byteLength,
    brotli: brotliCompressSync(source).byteLength
  }
}

async function createBaseline() {
  const artifacts = {}
  for (const file of [...artifactPaths, runtimeEntryPath]) {
    assert.equal(
      existsSync(file),
      true,
      `Runtime bundle ${file} does not exist. Build the runtime Wasm and @master/css-runtime before checking its size.`
    )
  }
  assert.equal(existsSync(bundlerRuntimeWasmPath), true, `Runtime Wasm ${bundlerRuntimeWasmPath} does not exist. Build the runtime Wasm first.`)
  assert.ok(
    readFileSync(bundlerRuntimeWasmPath).equals(readFileSync(artifactPaths[1])),
    `${bundlerRuntimeWasmPath} differs from ${artifactPaths[1]}; rebuild with cargo xtask build-wasm runtime.`
  )
  for (const file of artifactPaths) artifacts[file] = measure(readFileSync(file))
  artifacts[progressiveCriticalPath] = measure(await bundleProgressiveCriticalPath())
  return {
    version: 1,
    allowance: {
      minimumBytes: 1024,
      ratio: 0.01
    },
    artifacts
  }
}

const actual = await createBaseline()
if (process.argv.includes('--write')) {
  writeFileSync(baselinePath, `${JSON.stringify(actual, null, 2)}\n`)
  process.stdout.write(`Updated ${baselinePath}.\n`)
  process.exit(0)
}

assert.equal(existsSync(baselinePath), true, `Missing runtime bundle baseline ${baselinePath}.`)
const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
assert.equal(baseline.version, 1, 'Unsupported runtime bundle baseline version.')
assert.deepEqual(
  Object.keys(actual.artifacts),
  Object.keys(baseline.artifacts),
  'Runtime bundle baseline artifact list changed.'
)

for (const [file, sizes] of Object.entries(actual.artifacts)) {
  for (const format of ['raw', 'gzip', 'brotli']) {
    const previous = baseline.artifacts[file][format]
    const allowance = Math.max(
      baseline.allowance.minimumBytes,
      Math.ceil(previous * baseline.allowance.ratio)
    )
    assert.ok(
      sizes[format] <= previous + allowance,
      `${file} ${format} size ${sizes[format]} exceeds baseline ${previous} plus allowance ${allowance}.`
    )
  }
}

process.stdout.write(`Validated ${Object.keys(actual.artifacts).length} runtime bundle size baseline(s).\n`)
