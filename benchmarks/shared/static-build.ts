import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getStaticFixtureSource, staticFixtureIds } from '../fixtures/static'
import { summarizeBytes } from './bytes'
import {
    benchmarkRoot,
    findCSSFiles,
    measureRelativeArtifact,
    readFiles,
    resetDirectory,
    resolveBenchmarkPackageFile,
    runCommand,
    writeWorkspaceFiles
} from './runner'
import type {
    BenchmarkAdapter,
    BenchmarkArtifact,
    BenchmarkFixture,
    BenchmarkFixtureId,
    BenchmarkSample,
    BenchmarkVariant,
    ByteSummary
} from './types'

export type StaticBuildToolId =
    | 'master-static-cli'
    | 'master-static-vite'
    | 'tailwind-cli'
    | 'tailwind-vite'

export interface StaticBuildTool {
    id: StaticBuildToolId
    adapterId: 'master-static' | 'tailwind-cli' | 'tailwind-vite'
    label: string
    family: 'master' | 'tailwind'
    command: 'master-cli' | 'tailwind-cli' | 'master-vite' | 'tailwind-vite'
}

export interface StaticBuildResult {
    elapsedMs: number
    artifacts: BenchmarkArtifact[]
    cssFileCount: number
    cssBytes: ByteSummary
}

export const staticBuildTools = [
    {
        id: 'master-static-cli',
        adapterId: 'master-static',
        label: 'Master CSS static CLI',
        family: 'master',
        command: 'master-cli'
    },
    {
        id: 'master-static-vite',
        adapterId: 'master-static',
        label: 'Master CSS static Vite',
        family: 'master',
        command: 'master-vite'
    },
    {
        id: 'tailwind-cli',
        adapterId: 'tailwind-cli',
        label: 'Tailwind CSS CLI',
        family: 'tailwind',
        command: 'tailwind-cli'
    },
    {
        id: 'tailwind-vite',
        adapterId: 'tailwind-vite',
        label: 'Tailwind CSS Vite',
        family: 'tailwind',
        command: 'tailwind-vite'
    }
] satisfies StaticBuildTool[]

export const staticBenchmarkAdapters = [
    {
        id: 'master-static',
        name: 'Master CSS static',
        family: 'master-css'
    },
    {
        id: 'tailwind-cli',
        name: 'Tailwind CSS CLI',
        family: 'tailwind-css'
    },
    {
        id: 'tailwind-vite',
        name: 'Tailwind CSS Vite',
        family: 'tailwind-css'
    }
] satisfies BenchmarkAdapter[]

export function createStaticBuildVariants(): BenchmarkVariant[] {
    return staticFixtureIds.flatMap((fixtureId) => staticBuildTools.map((tool) => ({
        id: createStaticBuildVariantId(fixtureId, tool.id),
        fixtureId,
        adapterId: tool.adapterId,
        label: `${fixtureId} / ${tool.label}`
    })))
}

export function createStaticBuildVariantId(fixtureId: BenchmarkFixtureId, toolId: StaticBuildToolId) {
    return `${fixtureId}-${toolId}`
}

export function getStaticBenchmarkFixtures(fixtures: BenchmarkFixture[]) {
    return staticFixtureIds.map((id) => {
        const fixture = fixtures.find((candidate) => candidate.id === id)
        if (!fixture) throw new Error(`Missing benchmark fixture: ${id}`)
        return fixture
    })
}

export async function runStaticBuild(options: {
    suite: 'css-output-size' | 'build-performance'
    fixtureId: BenchmarkFixtureId
    tool: StaticBuildTool
    round: number
    workspaceName?: string
}) {
    const workspace = resolve(
        benchmarkRoot,
        '.results',
        options.suite,
        'workspaces',
        options.workspaceName || createStaticBuildVariantId(options.fixtureId, options.tool.id),
        `round-${options.round}`
    )

    await resetDirectory(workspace)
    await writeStaticWorkspace(workspace, options.fixtureId, options.tool)
    return runPreparedStaticBuild(workspace, options.fixtureId, options.tool)
}

export async function runPreparedStaticBuild(workspace: string, fixtureId: BenchmarkFixtureId, tool: StaticBuildTool): Promise<StaticBuildResult> {
    const result = await runCommand(
        resolveBuildCommand(tool),
        resolveBuildArgs(tool),
        workspace
    )
    const cssRoot = resolve(workspace, 'dist')
    const cssFiles = await findCSSFiles(cssRoot)

    if (!cssFiles.length) {
        throw new Error(`No CSS files were generated for ${fixtureId} / ${tool.id}.`)
    }

    const cssBuffer = await readFiles(cssFiles)
    const fixture = getStaticFixtureSource(fixtureId)
    for (const marker of fixture.expectedCSSMarkers) {
        if (!cssBuffer.includes(marker)) {
            throw new Error(`Generated CSS for ${fixtureId} / ${tool.id} is missing marker "${marker}".`)
        }
    }

    return {
        elapsedMs: result.elapsedMs,
        artifacts: await Promise.all(cssFiles.map((file) => measureRelativeArtifact(file))),
        cssFileCount: cssFiles.length,
        cssBytes: summarizeBytes(cssBuffer)
    }
}

export async function prepareStaticWorkspace(workspace: string, fixtureId: BenchmarkFixtureId, tool: StaticBuildTool) {
    await resetDirectory(workspace)
    await writeStaticWorkspace(workspace, fixtureId, tool)
}

export function createByteSamples(variantId: string, result: StaticBuildResult): BenchmarkSample[] {
    return [
        {
            metricId: 'css-raw-bytes',
            variantId,
            round: 0,
            value: result.cssBytes.rawBytes
        },
        {
            metricId: 'css-gzip-bytes',
            variantId,
            round: 0,
            value: result.cssBytes.gzipBytes
        },
        {
            metricId: 'css-brotli-bytes',
            variantId,
            round: 0,
            value: result.cssBytes.brotliBytes
        },
        {
            metricId: 'css-file-count',
            variantId,
            round: 0,
            value: result.cssFileCount
        }
    ]
}

async function writeStaticWorkspace(workspace: string, fixtureId: BenchmarkFixtureId, tool: StaticBuildTool) {
    const fixture = getStaticFixtureSource(fixtureId)
    const sourceHtml = tool.family === 'master' ? fixture.masterHtml : fixture.tailwindHtml
    const html = isViteTool(tool) ? addViteEntryScript(sourceHtml) : sourceHtml
    const css = tool.family === 'master'
        ? '@import "@master/css";\n@source "./index.html";\n.benchmark-root{box-sizing:border-box}\n'
        : '@import "tailwindcss";\n@source "./index.html";\n.benchmark-root{box-sizing:border-box}\n'

    await writeWorkspaceFiles(workspace, {
        'package.json': JSON.stringify({
            private: true,
            type: 'module'
        }, null, 2) + '\n',
        'index.html': html,
        'input.css': css
    })

    if (isViteTool(tool)) {
        await writeWorkspaceFiles(workspace, {
            'src/main.js': 'import "../input.css"\n',
            'vite.config.mjs': renderViteConfig(tool)
        })
    } else {
        await mkdir(resolve(workspace, 'dist'), { recursive: true })
    }
}

function isViteTool(tool: StaticBuildTool) {
    return tool.command === 'master-vite' || tool.command === 'tailwind-vite'
}

function addViteEntryScript(html: string) {
    return html.replace('</body>', '<script type="module" src="/src/main.js"></script>\n</body>')
}

function resolveBuildCommand(tool: StaticBuildTool) {
    return process.execPath
}

function resolveBuildArgs(tool: StaticBuildTool) {
    if (tool.command === 'master-cli') {
        return [
            resolveBenchmarkPackageFile('@master/css-cli', 'dist/bin/index.js'),
            'index.html',
            '-o',
            'dist/output.css',
            '-v',
            '0'
        ]
    }

    if (tool.command === 'tailwind-cli') {
        return [
            resolveBenchmarkPackageFile('@tailwindcss/cli', 'dist/index.mjs'),
            '-i',
            'input.css',
            '-o',
            'dist/output.css'
        ]
    }

    return [
        resolveBenchmarkPackageFile('vite', 'bin/vite.js'),
        'build',
        '--config',
        'vite.config.mjs',
        '--logLevel',
        'silent',
        '--clearScreen',
        'false'
    ]
}

function renderViteConfig(tool: StaticBuildTool) {
    const pluginImport = tool.command === 'master-vite'
        ? 'import masterCSS from "@master/css.vite"'
        : 'import tailwindcss from "@tailwindcss/vite"'
    const plugin = tool.command === 'master-vite'
        ? "masterCSS({ mode: 'static' })"
        : 'tailwindcss()'

    return [
        'import { defineConfig } from "vite"',
        pluginImport,
        '',
        'export default defineConfig({',
        `    plugins: [${plugin}],`,
        '    build: {',
        "        outDir: 'dist',",
        '        emptyOutDir: true,',
        '        rollupOptions: {',
        "            input: 'index.html'",
        '        }',
        '    }',
        '})',
        ''
    ].join('\n')
}
