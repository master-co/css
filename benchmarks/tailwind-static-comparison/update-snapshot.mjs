import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const fixtureIds = ['minimal', 'docs', 'dashboard', 'stress-css']
const variantIds = ['master-static-cli', 'master-static-vite', 'tailwind-cli', 'tailwind-vite']
const structureMetricIds = [
    'style-rule-count',
    'selector-count',
    'declaration-count',
    'custom-property-count',
    'important-declaration-count',
    'at-rule-count',
    'layer-block-count',
    'media-block-count',
    'supports-block-count',
    'container-block-count',
    'keyframes-count',
    'unlayered-style-rule-count',
    'layer-theme-style-rule-count',
    'layer-base-style-rule-count',
    'layer-defaults-style-rule-count',
    'layer-components-style-rule-count',
    'layer-utilities-style-rule-count',
    'layer-other-style-rule-count',
    'selector-combinator-count',
    'max-selector-specificity-score',
    'max-selector-complexity-score'
]

const variants = [
    {
        id: 'master-static-cli',
        label: 'Master CSS static CLI',
        family: 'master-css',
        tool: 'cli'
    },
    {
        id: 'master-static-vite',
        label: 'Master CSS static Vite',
        family: 'master-css',
        tool: 'vite'
    },
    {
        id: 'tailwind-cli',
        label: 'Tailwind CSS CLI',
        family: 'tailwind-css',
        tool: 'cli'
    },
    {
        id: 'tailwind-vite',
        label: 'Tailwind CSS Vite',
        family: 'tailwind-css',
        tool: 'vite'
    }
]

const reportSources = [
    {
        suite: 'css-output-size',
        file: '.results/css-output-size/report.json',
        command: 'pnpm --filter ./benchmarks bench:css-output-size'
    },
    {
        suite: 'build-performance',
        file: '.results/build-performance/report.json',
        command: 'pnpm --filter ./benchmarks bench:build-performance'
    },
    {
        suite: 'css-structure',
        file: '.results/css-structure/report.json',
        command: 'pnpm --filter ./benchmarks bench:css-structure'
    }
]

const __dirname = dirname(fileURLToPath(import.meta.url))
const benchmarkRoot = resolve(__dirname, '..')
const snapshotFile = resolve(__dirname, 'snapshot.json')

const reports = Object.fromEntries(await Promise.all(reportSources.map(async (source) => {
    const report = await readReport(source)
    return [source.suite, report]
})))

validateReports()

const snapshot = {
    schemaVersion: 1,
    suite: 'tailwind-static-comparison',
    generatedAt: new Date().toISOString(),
    sourceReports: reportSources.map((source) => ({
        suite: source.suite,
        generatedAt: reports[source.suite].generatedAt,
        command: source.command
    })),
    environment: reports['css-output-size'].environment,
    packages: mergePackages(reportSources.map((source) => reports[source.suite].packages)),
    fixtures: fixtureIds.map((id) => {
        const fixture = reports['css-output-size'].fixtures.find((candidate) => candidate.id === id)
        return {
            id: fixture.id,
            name: fixture.name,
            purpose: fixture.purpose
        }
    }),
    variants,
    metrics: [
        ...getMetrics(reports['css-output-size'], [
            'css-raw-bytes',
            'css-gzip-bytes',
            'css-brotli-bytes',
            'css-file-count'
        ]),
        ...getMetrics(reports['build-performance'], [
            'cold-build-ms',
            'repeat-build-ms'
        ]),
        ...getMetrics(reports['css-structure'], structureMetricIds)
    ],
    results: fixtureIds.map((fixtureId) => ({
        fixtureId,
        variants: Object.fromEntries(variantIds.map((variantId) => [
            variantId,
            createVariantResult(fixtureId, variantId)
        ]))
    })),
    limits: [
        'This snapshot compares generated CSS artifacts, CSS structure, and full production command elapsed time only.',
        'CSS bytes and structure are not browser parse, style recalculation, layout, paint, or interaction cost.',
        'Build timings include Node, CLI, Vite, and package startup for each command path.',
        'Repeat production build means a second command execution in the same temp workspace; it is not watch mode or HMR.',
        'Master CSS and Tailwind CSS fixtures target equivalent rendered UI intent, not identical class strings.',
        'Results are advisory and should be read with the package versions, commands, machine details, and fixture source.'
    ]
}

await writeFile(snapshotFile, `${JSON.stringify(snapshot, null, 4)}\n`)
console.log(`Wrote ${snapshotFile}`)

async function readReport(source) {
    const file = resolve(benchmarkRoot, source.file)
    const report = JSON.parse(await readFile(file, 'utf8'))
    if (report.suite !== source.suite) {
        throw new Error(`Expected ${source.suite} report at ${file}, received ${report.suite}.`)
    }
    return report
}

function validateReports() {
    const referenceEnvironment = JSON.stringify(reports['css-output-size'].environment)

    for (const source of reportSources) {
        const report = reports[source.suite]
        if (JSON.stringify(report.environment) !== referenceEnvironment) {
            throw new Error(`${source.suite} was generated in a different environment.`)
        }

        for (const fixtureId of fixtureIds) {
            if (!report.fixtures.some((fixture) => fixture.id === fixtureId)) {
                throw new Error(`${source.suite} is missing fixture ${fixtureId}.`)
            }

            for (const variantId of variantIds) {
                const fullVariantId = createFullVariantId(fixtureId, variantId)
                if (!report.variants.some((variant) => variant.id === fullVariantId)) {
                    throw new Error(`${source.suite} is missing variant ${fullVariantId}.`)
                }
            }
        }
    }

    for (const fixtureId of fixtureIds) {
        for (const variantId of variantIds) {
            const cssArtifact = findArtifact(reports['css-output-size'], fixtureId, variantId)
            const buildArtifact = findArtifact(reports['build-performance'], fixtureId, variantId)
            const structureArtifact = findArtifact(reports['css-structure'], fixtureId, variantId)

            if (cssArtifact.sha256 !== buildArtifact.sha256 || cssArtifact.sha256 !== structureArtifact.sha256) {
                throw new Error([
                    `CSS artifact SHA mismatch for ${fixtureId}-${variantId}:`,
                    `css-output-size=${cssArtifact.sha256},`,
                    `build-performance=${buildArtifact.sha256},`,
                    `css-structure=${structureArtifact.sha256}`
                ].join(' '))
            }
        }
    }
}

function createVariantResult(fixtureId, variantId) {
    const cssArtifact = findArtifact(reports['css-output-size'], fixtureId, variantId)
    const coldBuild = findSummary(reports['build-performance'], fixtureId, variantId, 'cold-build-ms')
    const repeatBuild = findSummary(reports['build-performance'], fixtureId, variantId, 'repeat-build-ms')

    return {
        css: {
            rawBytes: cssArtifact.rawBytes,
            gzipBytes: cssArtifact.gzipBytes,
            brotliBytes: cssArtifact.brotliBytes,
            fileCount: findSummary(reports['css-output-size'], fixtureId, variantId, 'css-file-count').median,
            sha256: cssArtifact.sha256
        },
        build: {
            coldMedianMs: roundOne(coldBuild.median),
            repeatMedianMs: roundOne(repeatBuild.median),
            sampleCount: coldBuild.sampleCount
        },
        structure: createStructureResult(fixtureId, variantId)
    }
}

function createStructureResult(fixtureId, variantId) {
    const pick = (metricId) => findSummary(reports['css-structure'], fixtureId, variantId, metricId).median

    return {
        styleRules: pick('style-rule-count'),
        selectors: pick('selector-count'),
        declarations: pick('declaration-count'),
        customProperties: pick('custom-property-count'),
        importantDeclarations: pick('important-declaration-count'),
        atRules: pick('at-rule-count'),
        layerBlocks: pick('layer-block-count'),
        mediaBlocks: pick('media-block-count'),
        supportsBlocks: pick('supports-block-count'),
        containerBlocks: pick('container-block-count'),
        keyframes: pick('keyframes-count'),
        unlayeredStyleRules: pick('unlayered-style-rule-count'),
        layerStyleRules: {
            theme: pick('layer-theme-style-rule-count'),
            base: pick('layer-base-style-rule-count'),
            defaults: pick('layer-defaults-style-rule-count'),
            components: pick('layer-components-style-rule-count'),
            utilities: pick('layer-utilities-style-rule-count'),
            other: pick('layer-other-style-rule-count')
        },
        selectorCombinators: pick('selector-combinator-count'),
        maxSelectorSpecificityScore: pick('max-selector-specificity-score'),
        maxSelectorComplexityScore: pick('max-selector-complexity-score')
    }
}

function findSummary(report, fixtureId, variantId, metricId) {
    const fullVariantId = createFullVariantId(fixtureId, variantId)
    const summary = report.summary.find((candidate) => candidate.variantId === fullVariantId && candidate.metricId === metricId)
    if (!summary) {
        throw new Error(`${report.suite} is missing ${metricId} for ${fullVariantId}.`)
    }
    return summary
}

function findArtifact(report, fixtureId, variantId) {
    const workspaceSegment = `/workspaces/${createFullVariantId(fixtureId, variantId)}/`
    const artifact = report.artifacts.find((candidate) => candidate.path.includes(workspaceSegment))
    if (!artifact) {
        throw new Error(`${report.suite} is missing artifact for ${fixtureId}-${variantId}.`)
    }
    return artifact
}

function getMetrics(report, metricIds) {
    return metricIds.map((metricId) => {
        const metric = report.metrics.find((candidate) => candidate.id === metricId)
        if (!metric) throw new Error(`${report.suite} is missing metric ${metricId}.`)
        return metric
    })
}

function mergePackages(packageSets) {
    const packages = new Map()

    for (const packageSet of packageSets) {
        for (const packageInfo of packageSet) {
            packages.set(packageInfo.name, packageInfo)
        }
    }

    return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function createFullVariantId(fixtureId, variantId) {
    return `${fixtureId}-${variantId}`
}

function roundOne(value) {
    return Number(value.toFixed(1))
}
