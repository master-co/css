import { resolve } from 'node:path'
import { bench, describe } from 'vitest'
import { benchmarkRoot, runCommandStream } from '../shared/runner'

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

async function writeBrowserLifecycleReportOnce() {
  if (!reportPromise) {
    reportPromise = (async () => {
      const result = await runCommandStream(
        process.execPath,
        [
          '--import',
          'tsx',
          resolve('browser-lifecycle', 'run-report.ts')
        ],
        benchmarkRoot,
        {
          stdout: (chunk) => process.stdout.write(chunk),
          stderr: (chunk) => process.stderr.write(chunk)
        }
      )

      return result.elapsedMs
    })()
  }

  return reportPromise
}

describe('browser lifecycle', () => {
  bench('write browser lifecycle report', async () => {
    await writeBrowserLifecycleReportOnce()
  }, benchOptions)
})
