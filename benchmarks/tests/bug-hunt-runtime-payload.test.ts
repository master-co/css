import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { expect, test } from 'vitest'
import { createPayloadSamples as deliverySamples } from '../shared/delivery-mode-samples'
import { createPayloadSamples as lifecycleSamples } from '../shared/browser-lifecycle-samples'
import { masterDeliveryModeMetrics } from '../shared/delivery-mode-metrics'
import { browserLifecycleMetrics } from '../shared/browser-lifecycle-metrics'
import { runtimeWasmFile } from '../shared/runtime-payload'
import { writeWorkspaceFiles } from '../shared/runner'

// Include invalid UTF-8 so an accidental string conversion corrupts the assertion.
const wasm = Buffer.from([0, 97, 115, 109, 1, 0, 0, 0, 255, 254, 128])

test('workspace delivery preserves binary sidecars in nested directories', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'master-benchmark-payload-'))
  try {
    await writeWorkspaceFiles(root, { 'index.html': '<p>hello</p>', [runtimeWasmFile]: wasm })
    expect(await readFile(resolve(root, runtimeWasmFile))).toEqual(wasm)
    expect(await readFile(resolve(root, 'index.html'), 'utf8')).toBe('<p>hello</p>')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

for (const [name, samples, metrics] of [
  ['delivery', deliverySamples, masterDeliveryModeMetrics],
  ['lifecycle', lifecycleSamples, browserLifecycleMetrics]
] as const) {
  for (const runtime of [true, false]) {
    test(`${name} accounts for ${runtime ? 'runtime' : 'absent'} Wasm separately from JS`, () => {
      const result = samples('variant', {
        html: Buffer.from('<html></html>'), externalCSS: Buffer.alloc(0), inlineCSS: Buffer.alloc(0),
        runtimeJS: Buffer.from('console.log(1)'), runtimeWasm: runtime ? wasm : Buffer.alloc(0),
        manifestJSON: Buffer.alloc(0), hydrationManifestJSON: Buffer.alloc(0)
      })
      const expected = { raw: wasm.length, gzip: gzipSync(wasm).length, brotli: brotliCompressSync(wasm).length }
      for (const [encoding, bytes] of Object.entries(expected)) {
        const id = `runtime-wasm-${encoding}-bytes`
        expect(metrics.filter((metric) => metric.id === id)).toHaveLength(1)
        expect(result.filter((sample) => sample.metricId === id)).toEqual([
          { variantId: 'variant', round: 0, metricId: id, value: runtime ? bytes : 0 }
        ])
      }
      expect(result.find((sample) => sample.metricId === 'runtime-js-raw-bytes')?.value).toBe(14)
      expect(result.every((sample) => metrics.some((metric) => metric.id === sample.metricId))).toBe(true)
    })
  }
}
