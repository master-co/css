import { resolve } from 'node:path'
import { test, describe } from 'vitest'
import { benchmarkRoot, runCommand } from '../shared/runner'

const benchOptions = {
  iterations: 1,
  retainSamples: true,
  throws: true,
  time: 1,
  warmup: false,
  warmupIterations: 0,
  warmupTime: 0
}

let reportPromise: Promise<number> | undefined

async function writeMasterDeliveryModeReportOnce() {
  if (!reportPromise) {
    reportPromise = (async () => {
      const result = await runCommand(
        process.execPath,
        [
          '--import',
          'tsx',
          resolve('master-delivery-modes', 'run-report.ts')
        ],
        benchmarkRoot
      )

      if (result.stdout) console.log(result.stdout.trim())
      if (result.stderr) console.error(result.stderr.trim())

      return result.elapsedMs
    })()
  }

  return reportPromise
}

describe('Master delivery modes', () => {
  test('write Master delivery modes report', { timeout: 900_000 }, async ({ bench }) => {
    await bench('write Master delivery modes report', async () => {
      await writeMasterDeliveryModeReportOnce()
    }).run(benchOptions)
  })
})
