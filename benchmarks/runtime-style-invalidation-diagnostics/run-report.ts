import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { benchmarkRoot, runCommand } from '../shared/runner'
import {
    listRuntimeStyleInvalidationDiagnosticVariantIds,
    writeMergedRuntimeStyleInvalidationDiagnosticsReport,
    writeRuntimeStyleInvalidationDiagnosticsReport
} from '../shared/runtime-style-invalidation-diagnostics'
import type { BenchmarkReport } from '../shared/types'

const variantId = process.env.RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_VARIANT
const isChild = process.env.RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_CHILD === '1'
const reportFile = resolve(benchmarkRoot, '.results', 'runtime-style-invalidation-diagnostics', 'report.json')

const output = !variantId && !isChild
    ? await writeMergedReportFromVariantChildren()
    : await writeRuntimeStyleInvalidationDiagnosticsReport()

console.log(`Wrote runtime style invalidation diagnostics report JSON to ${output.jsonFile}`)
console.log(`Wrote runtime style invalidation diagnostics report Markdown to ${output.markdownFile}`)

async function writeMergedReportFromVariantChildren() {
    const reports: BenchmarkReport[] = []
    for (const variantId of listRuntimeStyleInvalidationDiagnosticVariantIds()) {
        console.log(`Running runtime style invalidation diagnostics child for ${variantId}`)
        const result = await runCommand(
            process.execPath,
            [
                '--import',
                'tsx',
                resolve('runtime-style-invalidation-diagnostics', 'run-report.ts')
            ],
            benchmarkRoot,
            {
                env: {
                    RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_CHILD: '1',
                    RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_VARIANT: variantId
                },
                timeoutMs: getChildTimeoutMs()
            }
        )
        console.log(`Finished runtime style invalidation diagnostics child for ${variantId} in ${Math.round(result.elapsedMs)}ms`)
        if (result.stderr) console.error(result.stderr.trim())
        reports.push(JSON.parse(await readFile(reportFile, 'utf8')) as BenchmarkReport)
    }

    return writeMergedRuntimeStyleInvalidationDiagnosticsReport(reports)
}

function getChildTimeoutMs() {
    const value = Number(process.env.RUNTIME_STYLE_INVALIDATION_DIAGNOSTIC_CHILD_TIMEOUT_MS || 120000)
    if (!Number.isFinite(value) || value < 1000) return 120000
    return Math.floor(value)
}
