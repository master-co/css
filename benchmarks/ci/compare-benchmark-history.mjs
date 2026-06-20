import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import process from 'node:process'

const args = parseArgs(process.argv.slice(2))
const currentFile = requiredArg(args, 'current')
const outputFile = args.get('output')
const limit = Number(args.get('limit') || 50)
const current = JSON.parse(await readFile(currentFile, 'utf8'))
const artifactPrefix = args.get('artifact-prefix') || `master-css-benchmark-${current.branchSlug}-${current.packageSlug}-`

let markdown

try {
    markdown = await compareHistory()
} catch (error) {
    markdown = [
        '# Benchmark history',
        '',
        `History unavailable: ${error instanceof Error ? error.message : String(error)}`,
        '',
        'Current benchmark results were still produced. History comparison is advisory only.',
        ''
    ].join('\n')
}

if (outputFile) {
    await mkdir(dirname(outputFile), { recursive: true })
    await writeFile(outputFile, `${markdown.trimEnd()}\n`)
}

console.log(markdown.trimEnd())

async function compareHistory() {
    const token = process.env.GITHUB_TOKEN
    const repository = process.env.GITHUB_REPOSITORY

    if (!token || !repository) {
        return [
            '# Benchmark history',
            '',
            'No GitHub token or repository metadata is available; skipped artifact history comparison.',
            ''
        ].join('\n')
    }

    const artifacts = (await listArtifacts(repository, token))
        .filter((artifact) => !artifact.expired && artifact.name.startsWith(artifactPrefix))
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))

    const selected = artifacts.slice(0, limit)
    const reports = []

    for (const artifact of selected) {
        const report = await readArtifactReport(artifact, token)
        if (report?.packageSlug === current.packageSlug && report?.branchSlug === current.branchSlug) {
            reports.push({ artifact, report })
        }
    }

    return renderHistoryMarkdown(reports, artifacts.length)
}

async function listArtifacts(repository, token) {
    const artifacts = []

    for (let page = 1; page <= 20; page++) {
        const response = await githubFetch(`https://api.github.com/repos/${repository}/actions/artifacts?per_page=100&page=${page}`, token)
        const body = await response.json()
        artifacts.push(...body.artifacts || [])
        if (!body.artifacts?.length || artifacts.length >= body.total_count) break
    }

    return artifacts
}

async function readArtifactReport(artifact, token) {
    const response = await githubFetch(artifact.archive_download_url, token)
    const directory = await mkdtemp(join(tmpdir(), 'master-css-benchmark-'))
    const zipFile = join(directory, `${artifact.id}.zip`)
    await writeFile(zipFile, Buffer.from(await response.arrayBuffer()))

    const list = spawnSync('unzip', ['-Z1', zipFile], { encoding: 'utf8' })
    if (list.status !== 0) return undefined

    const entry = list.stdout
        .split('\n')
        .find((candidate) => candidate.endsWith('benchmark-results.json'))

    if (!entry) return undefined

    const extracted = spawnSync('unzip', ['-p', zipFile, entry], { encoding: 'utf8' })
    if (extracted.status !== 0) return undefined

    return JSON.parse(extracted.stdout)
}

function renderHistoryMarkdown(history, totalMatchingArtifacts) {
    const lines = [
        '# Benchmark history',
        '',
        `- Package: ${current.package}`,
        `- Branch: ${current.branch}`,
        `- Current commit: ${current.commit}`,
        `- Artifact prefix: ${artifactPrefix}`,
        `- Compared artifacts: ${history.length}`,
        `- History cap: latest ${limit} matching artifacts; ${Math.max(totalMatchingArtifacts - limit, 0)} older artifacts ignored`,
        ''
    ]

    if (!history.length) {
        lines.push('No previous matching benchmark artifacts were found.', '')
        return lines.join('\n')
    }

    const latest = history[0].report
    lines.push('| Benchmark | Current median | Latest median | Latest delta | Rolling median | Rolling delta |')
    lines.push('|---|---:|---:|---:|---:|---:|')

    for (const benchmark of current.benchmarks) {
        const latestBenchmark = findBenchmark(latest, benchmark.name)
        const rollingMedian = median(history
            .map(({ report }) => findBenchmark(report, benchmark.name)?.median)
            .filter(Number.isFinite))
        lines.push([
            benchmark.name,
            formatMetric(benchmark.median, benchmark.unit),
            formatMetric(latestBenchmark?.median, benchmark.unit),
            formatDelta(benchmark.median, latestBenchmark?.median),
            formatMetric(rollingMedian, benchmark.unit),
            formatDelta(benchmark.median, rollingMedian)
        ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
    }

    lines.push('', '| Asset | Current raw | Latest raw | Raw delta | Current gzip | Latest gzip | Gzip delta | Current brotli | Latest brotli | Brotli delta | Hash |')
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|')

    for (const asset of getReportAssets(current)) {
        const latestAsset = findAsset(latest, asset.file)
        lines.push([
            asset.file,
            formatBytes(asset.rawBytes),
            formatBytes(latestAsset?.rawBytes),
            formatDelta(asset.rawBytes, latestAsset?.rawBytes),
            formatBytes(asset.gzipBytes),
            formatBytes(latestAsset?.gzipBytes),
            formatDelta(asset.gzipBytes, latestAsset?.gzipBytes),
            formatBytes(asset.brotliBytes),
            formatBytes(latestAsset?.brotliBytes),
            formatDelta(asset.brotliBytes, latestAsset?.brotliBytes),
            formatHashStatus(asset.sha256, latestAsset?.sha256)
        ].join(' | ').replace(/^/, '| ').replace(/$/, ' |'))
    }

    lines.push('', 'Positive deltas mean the current run is slower or larger. This comparison is advisory only.', '')
    return lines.join('\n')
}

async function githubFetch(url, token) {
    const response = await fetch(url, {
        headers: {
            accept: 'application/vnd.github+json',
            authorization: `Bearer ${token}`,
            'x-github-api-version': '2022-11-28'
        }
    })

    if (!response.ok) {
        throw new Error(`GitHub API request failed ${response.status} for ${url}`)
    }

    return response
}

function findBenchmark(report, name) {
    return report?.benchmarks?.find((benchmark) => benchmark.name === name)
}

function getReportAssets(report) {
    if (Array.isArray(report?.assets) && report.assets.length) return report.assets
    return report?.bundle ? [report.bundle] : []
}

function findAsset(report, file) {
    return getReportAssets(report).find((asset) => asset.file === file)
}

function median(values) {
    if (!values.length) return undefined
    const sorted = [...values].sort((left, right) => left - right)
    const middle = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function formatMetric(value, unit) {
    if (!Number.isFinite(value)) return ''
    return `${value.toFixed(2)} ${unit}`
}

function formatBytes(value) {
    if (!Number.isFinite(value)) return ''
    return `${value.toLocaleString('en-US')} B`
}

function formatDelta(currentValue, baselineValue) {
    if (!Number.isFinite(currentValue) || !Number.isFinite(baselineValue) || baselineValue === 0) return ''
    const delta = ((currentValue - baselineValue) / baselineValue) * 100
    return `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`
}

function formatHashStatus(currentHash, baselineHash) {
    if (!currentHash || !baselineHash) return ''
    return currentHash === baselineHash ? 'unchanged' : 'changed'
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
