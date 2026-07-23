import assert from 'node:assert/strict'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const baselinePath = path.resolve('.ai/contracts/runtime-bundle-size.json')
const artifactPaths = [
  'packages/runtime/dist/global.min.js'
]

function measure(file) {
  const source = readFileSync(file)
  return {
    raw: source.byteLength,
    gzip: gzipSync(source, { level: 9 }).byteLength,
    brotli: brotliCompressSync(source).byteLength
  }
}

function createBaseline() {
  const artifacts = {}
  for (const file of artifactPaths) {
    assert.equal(
      existsSync(file),
      true,
      `Runtime bundle ${file} does not exist. Build @master/css-runtime before checking its size.`
    )
    artifacts[file] = measure(file)
  }
  return {
    version: 1,
    allowance: {
      minimumBytes: 1024,
      ratio: 0.01
    },
    artifacts
  }
}

const actual = createBaseline()
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
