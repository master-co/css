import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { createPayloadSamples as deliverySamples } from '../shared/delivery-mode-samples'
import { createPayloadSamples as lifecycleSamples } from '../shared/browser-lifecycle-samples'
import { masterDeliveryModeMetrics } from '../shared/delivery-mode-metrics'
import { browserLifecycleMetrics } from '../shared/browser-lifecycle-metrics'
import { writeWorkspaceFiles } from '../shared/runner'

// Include invalid UTF-8 so an accidental string conversion corrupts the assertion.
const program = Buffer.from([77, 67, 83, 80, 1, 0, 0, 0, 255, 254, 128])

test('workspace delivery preserves binary files in nested directories', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'master-benchmark-payload-'))
  try {
    await writeWorkspaceFiles(root, { 'index.html': '<p>hello</p>', 'dist/default-program.bin': program })
    expect(await readFile(resolve(root, 'dist/default-program.bin'))).toEqual(program)
    expect(await readFile(resolve(root, 'index.html'), 'utf8')).toBe('<p>hello</p>')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

for (const [name, samples, metrics] of [
  ['delivery', deliverySamples, masterDeliveryModeMetrics],
  ['lifecycle', lifecycleSamples, browserLifecycleMetrics]
] as const) {
  test(`${name} accounts for the runtime JS, which includes the engine`, () => {
    const result = samples('variant', {
      html: Buffer.from('<html></html>'), externalCSS: Buffer.alloc(0), inlineCSS: Buffer.alloc(0),
      runtimeJS: Buffer.from('console.log(1)'), manifestJSON: Buffer.alloc(0), hydrationManifestJSON: Buffer.alloc(0)
    })
    expect(result.find((sample) => sample.metricId === 'runtime-js-raw-bytes')?.value).toBe(14)
    expect(result.every((sample) => metrics.some((metric) => metric.id === sample.metricId))).toBe(true)
  })
}
