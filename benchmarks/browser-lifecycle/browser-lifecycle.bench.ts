import { resolve } from 'node:path'
import { bench, describe } from 'vitest'
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

async function writeBrowserLifecycleReportOnce() {
    if (!reportPromise) {
        reportPromise = (async () => {
            const result = await runCommand(
                process.execPath,
                [
                    '--import',
                    'tsx',
                    resolve('browser-lifecycle', 'run-report.ts')
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

describe('browser lifecycle', () => {
    bench('write browser lifecycle report', async () => {
        await writeBrowserLifecycleReportOnce()
    }, benchOptions)
})
