import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { platform, release } from 'node:os'
import process from 'node:process'

const args = parseArgs(process.argv.slice(2))
const outputRoot = resolve(requiredArg(args, 'output'))
const engineInput = resolve(requiredArg(args, 'engine'))
const runtimeInput = resolve(requiredArg(args, 'runtime'))
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const metadata = createMetadata()
const reports = [
    normalizeEngineReport(await readJSON(engineInput), metadata),
    normalizeRuntimeReport(await readJSON(runtimeInput), metadata)
]

for (const report of reports) {
    const packageDir = resolve(outputRoot, report.packageSlug)
    await mkdir(packageDir, { recursive: true })
    await writeJSON(resolve(packageDir, 'benchmark-results.json'), report)
    await writeFile(resolve(packageDir, 'benchmark-results.md'), renderMarkdown(report))
}

await writeJSON(resolve(outputRoot, 'benchmark-summary.json'), {
    schemaVersion: 1,
    generatedAt: metadata.generatedAt,
    branch: metadata.branch,
    branchSlug: metadata.branchSlug,
    commit: metadata.commit,
    run: metadata.run,
    environment: metadata.environment,
    packages: reports.map((report) => ({
        package: report.package,
        packageSlug: report.packageSlug,
        benchmarkCount: report.benchmarks.length,
        bundle: report.bundle,
        assets: report.assets
    }))
})

function normalizeEngineReport(raw, baseMetadata) {
    const benchmarks = []

    for (const file of raw.files || []) {
        for (const group of file.groups || []) {
            for (const benchmark of group.benchmarks || []) {
                benchmarks.push({
                    name: benchmark.name,
                    group: group.fullName,
                    file: toRepoPath(file.filepath),
                    unit: 'ms/op',
                    hz: benchmark.hz,
                    min: benchmark.min,
                    max: benchmark.max,
                    mean: benchmark.mean,
                    median: benchmark.median,
                    rme: benchmark.rme,
                    sampleCount: benchmark.sampleCount
                })
            }
        }
    }

    const assets = [
        measureAsset('packages/engine/dist/core.mjs')
    ]

    return {
        ...baseMetadata,
        package: '@master/css-engine',
        packageSlug: 'engine',
        tool: 'vitest bench',
        config: {
            source: 'packages/engine/tests/core.bench.ts'
        },
        benchmarks,
        bundle: assets[0],
        assets
    }
}

function normalizeRuntimeReport(raw, baseMetadata) {
    const assets = [
        measureAsset('packages/runtime/dist/global.min.js'),
        measureAsset('packages/runtime/dist/default-manifest.json')
    ]

    return {
        ...baseMetadata,
        package: '@master/css-runtime',
        packageSlug: 'runtime',
        tool: raw.tool || 'playwright',
        browser: raw.browser,
        config: raw.config,
        benchmarks: (raw.benchmarks || []).map((benchmark) => ({
            name: benchmark.name,
            unit: benchmark.unit || 'ms',
            samples: benchmark.samples,
            min: benchmark.min,
            max: benchmark.max,
            mean: benchmark.mean,
            median: benchmark.median,
            sampleCount: benchmark.samples?.length
        })),
        bundle: assets[0],
        assets
    }
}

function createMetadata() {
    const branch = process.env.GITHUB_REF_NAME || process.env.BENCHMARK_BRANCH || currentBranchFallback()
    return {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        branch,
        branchSlug: process.env.BENCHMARK_BRANCH_SLUG || slugify(branch),
        commit: process.env.GITHUB_SHA || process.env.BENCHMARK_COMMIT || currentCommitFallback(),
        run: {
            id: process.env.GITHUB_RUN_ID,
            attempt: process.env.GITHUB_RUN_ATTEMPT,
            workflow: process.env.GITHUB_WORKFLOW,
            repository: process.env.GITHUB_REPOSITORY
        },
        environment: {
            os: process.env.RUNNER_OS || platform(),
            osRelease: release(),
            node: process.version
        }
    }
}

function measureAsset(file) {
    const absolute = resolve(root, file)
    const content = readFileSync(absolute)
    return {
        file,
        rawBytes: content.length,
        gzipBytes: gzipSync(content).length,
        brotliBytes: brotliCompressSync(content).length,
        sha256: createHash('sha256').update(content).digest('hex')
    }
}

function renderMarkdown(report) {
    const lines = [
        `# ${report.package} benchmark`,
        '',
        `- Branch: ${report.branch}`,
        `- Commit: ${report.commit}`,
        `- Tool: ${report.tool}`,
        `- Generated: ${report.generatedAt}`,
        `- Environment: ${report.environment.os} ${report.environment.osRelease}, Node ${report.environment.node}`
    ]

    if (report.browser) {
        lines.push(`- Browser: ${report.browser.name} ${report.browser.version}`)
    }

    lines.push('', '## Assets', '')
    lines.push('| File | Raw | Gzip | Brotli | SHA-256 |')
    lines.push('|---|---:|---:|---:|---|')

    for (const asset of report.assets) {
        lines.push(`| ${asset.file} | ${formatBytes(asset.rawBytes)} | ${formatBytes(asset.gzipBytes)} | ${formatBytes(asset.brotliBytes)} | \`${asset.sha256.slice(0, 12)}\` |`)
    }

    lines.push(
        '',
        '## Benchmarks',
        '',
        '| Benchmark | Median | Mean | Min | Max | Samples |',
        '|---|---:|---:|---:|---:|---:|'
    )

    for (const benchmark of report.benchmarks) {
        lines.push(`| ${benchmark.name} | ${formatMetric(benchmark.median, benchmark.unit)} | ${formatMetric(benchmark.mean, benchmark.unit)} | ${formatMetric(benchmark.min, benchmark.unit)} | ${formatMetric(benchmark.max, benchmark.unit)} | ${benchmark.sampleCount ?? ''} |`)
    }

    lines.push('')
    return `${lines.join('\n')}\n`
}

function formatMetric(value, unit) {
    if (!Number.isFinite(value)) return ''
    return `${value.toFixed(2)} ${unit}`
}

function formatBytes(value) {
    return `${value.toLocaleString('en-US')} B`
}

async function readJSON(file) {
    return JSON.parse(await readFile(file, 'utf8'))
}

async function writeJSON(file, value) {
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, `${JSON.stringify(value, null, 2)}\n`)
}

function toRepoPath(file) {
    const normalizedRoot = `${root}/`
    return file?.startsWith(normalizedRoot) ? file.slice(normalizedRoot.length) : file
}

function parseArgs(values) {
    const parsed = new Map()
    for (let index = 0; index < values.length; index++) {
        const value = values[index]
        if (!value.startsWith('--')) continue
        parsed.set(value.slice(2), values[index + 1])
        index++
    }
    return parsed
}

function requiredArg(args, name) {
    const value = args.get(name)
    if (!value) throw new Error(`Missing --${name}.`)
    return value
}

function slugify(value) {
    return String(value || 'unknown')
        .replace(/[^a-zA-Z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'unknown'
}

function currentBranchFallback() {
    return 'local'
}

function currentCommitFallback() {
    return 'local'
}
