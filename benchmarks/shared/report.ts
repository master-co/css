import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BenchmarkReport } from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const benchmarkRoot = resolve(__dirname, '..')

export async function writeBenchmarkReport(report: BenchmarkReport) {
    const outputRoot = resolve(benchmarkRoot, `.results/${report.suite}`)
    const jsonFile = resolve(outputRoot, 'report.json')
    const markdownFile = resolve(outputRoot, 'report.md')

    await mkdir(outputRoot, { recursive: true })
    await writeJSON(jsonFile, report)
    await writeFile(markdownFile, renderBenchmarkReportMarkdown(report))

    return {
        outputRoot,
        jsonFile,
        markdownFile
    }
}

function renderBenchmarkReportMarkdown(report: BenchmarkReport) {
    const lines = [
        `# ${report.suite} benchmark report`,
        '',
        `- Generated: ${report.generatedAt}`,
        `- Environment: ${report.environment.os.platform} ${report.environment.os.release} ${report.environment.os.arch}, Node ${report.environment.node}`,
        `- CPU: ${report.environment.cpu.model} (${report.environment.cpu.count})`,
        '',
        '## Packages',
        '',
        '| Package | Version |',
        '|---|---|'
    ]

    if (report.browser) {
        lines.splice(5, 0, `- Browser: ${report.browser.name} ${report.browser.version}`)
    }

    for (const packageInfo of report.packages) {
        lines.push(`| ${packageInfo.name} | ${packageInfo.version} |`)
    }

    lines.push('', '## Summary', '')
    lines.push('| Variant | Metric | Median | Mean | Min | Max | Samples |')
    lines.push('|---|---|---:|---:|---:|---:|---:|')

    for (const summary of report.summary) {
        const variant = report.variants.find((candidate) => candidate.id === summary.variantId)
        const metric = report.metrics.find((candidate) => candidate.id === summary.metricId)
        lines.push([
            variant?.label || summary.variantId,
            metric?.label || summary.metricId,
            formatMetric(summary.median, summary.unit),
            formatMetric(summary.mean, summary.unit),
            formatMetric(summary.min, summary.unit),
            formatMetric(summary.max, summary.unit),
            summary.sampleCount
        ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
    }

    if (report.limits.length) {
        lines.push('', '## Limits', '')
        for (const limit of report.limits) lines.push(`- ${limit}`)
    }

    lines.push('')
    return lines.join('\n')
}

async function writeJSON(file: string, value: unknown) {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

function formatMetric(value: number, unit: string) {
    if (!Number.isFinite(value)) return ''
    const formatted = Number(value.toFixed(3)).toLocaleString('en-US')
    return `${formatted} ${unit}`
}
