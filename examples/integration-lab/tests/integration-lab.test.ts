import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, describe, expect, test } from 'vitest'

const packageDir = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const tmpDir = join(packageDir, 'tmp')
const expectedStaticCSS = [
    '.block{display:block}',
    '.fg\\:primary{color:var(--color-primary)}'
]

const runningProcesses = new Set<ChildProcess>()

afterEach(() => {
    for (const process of runningProcesses) {
        process.kill()
    }
    runningProcesses.clear()
})

function createFixture(prefix: string) {
    mkdirSync(tmpDir, { recursive: true })
    const root = join(tmpDir, `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`)
    mkdirSync(root, { recursive: true })
    return root
}

function writeProjectFiles(root: string, files: Record<string, string>) {
    for (const [name, content] of Object.entries(files)) {
        const file = join(root, name)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, content)
    }
}

async function importFixtureModule<T = { default: unknown }>(file: string): Promise<T> {
    return await import(`${pathToFileURL(file).href}?t=${Date.now()}-${Math.random().toString(16).slice(2)}`) as T
}

function readOutputFileContents(root: string, matches: (path: string) => boolean): string[] {
    if (!existsSync(root)) return []
    return readdirSync(root).flatMap((entry) => {
        const path = join(root, entry)
        if (statSync(path).isDirectory()) return readOutputFileContents(path, matches)
        return matches(path) ? [readFileSync(path, 'utf-8')] : []
    })
}

function readOutputFiles(root: string, matches: (path: string) => boolean) {
    return readOutputFileContents(root, matches).join('\n')
}

function count(source: string, pattern: string | RegExp) {
    if (pattern instanceof RegExp) return source.match(pattern)?.length ?? 0
    return source.split(pattern).length - 1
}

function expectStaticCSS(css: string) {
    for (const expected of expectedStaticCSS) {
        expect(css).toContain(expected)
    }
    expect(css).toContain('--color-primary:#123456')
}

function expectNoDuplicateRuntimeHTML(html: string) {
    expect(count(html, 'master-css-runtime')).toBeLessThanOrEqual(2)
    expect(count(html, /id="master-css"/g)).toBeLessThanOrEqual(1)
}

function commonPackageJSON() {
    return JSON.stringify({
        private: true,
        type: 'module'
    }, null, 4)
}

function commonStyle() {
    return [
        "@import '@master/css';",
        '',
        '@theme {',
        '    --color-primary: #123456;',
        '}',
        ''
    ].join('\n')
}

function createRspackFixture(mode: 'runtime' | 'static') {
    const root = createFixture(`rspack-${mode}`)
    const modeOption = mode === 'static' ? "mode: 'static'," : ''
    writeProjectFiles(root, {
        'package.json': commonPackageJSON(),
        'src/index.html': [
            '<!doctype html>',
            '<html>',
            '<head><title>Rspack fixture</title></head>',
            '<body>',
            '    <main id="root" class="block fg:primary">Rspack fixture</main>',
            '</body>',
            '</html>',
            ''
        ].join('\n'),
        'src/main.js': [
            "import './app.css'",
            '',
            'document.getElementById("root").className = "block fg:primary"',
            "document.getElementById('root').dataset.ready = 'true'",
            ''
        ].join('\n'),
        'src/app.css': commonStyle(),
        'rspack.config.mjs': [
            "import { dirname, join } from 'node:path'",
            "import { fileURLToPath } from 'node:url'",
            "import { rspack } from '@rspack/core'",
            "import MasterCSSPlugin from '@master/css.webpack'",
            '',
            'const root = dirname(fileURLToPath(import.meta.url))',
            '',
            'export default {',
            '    context: root,',
            "    mode: 'production',",
            "    entry: './src/main.js',",
            '    output: {',
            "        path: join(root, 'dist'),",
            "        filename: '[name].js',",
            "        chunkFilename: '[name].js',",
            '        clean: true',
            '    },',
            '    module: {',
            '        rules: [',
            "            { test: /\\.css$/i, use: [rspack.CssExtractRspackPlugin.loader, 'css-loader'] }",
            '        ]',
            '    },',
            '    plugins: [',
            "        new rspack.HtmlRspackPlugin({ template: join(root, 'src/index.html') }),",
            "        new rspack.CssExtractRspackPlugin({ filename: '[name].css' }),",
            `        new MasterCSSPlugin({ ${modeOption} }, root)`,
            '    ]',
            '}',
            ''
        ].join('\n')
    })
    return root
}

function createRsbuildFixture(mode: 'runtime' | 'static') {
    const root = createFixture(`rsbuild-${mode}`)
    const modeOption = mode === 'static' ? "mode: 'static'," : ''
    writeProjectFiles(root, {
        'package.json': commonPackageJSON(),
        'src/index.html': [
            '<!doctype html>',
            '<html>',
            '<head><title>Rsbuild fixture</title></head>',
            '<body><div id="root"></div></body>',
            '</html>',
            ''
        ].join('\n'),
        'src/main.jsx': [
            "import React from 'react'",
            "import { createRoot } from 'react-dom/client'",
            "import './app.css'",
            '',
            'createRoot(document.getElementById("root")).render(',
            '    <main className="block fg:primary">Rsbuild fixture</main>',
            ')',
            ''
        ].join('\n'),
        'src/app.css': commonStyle(),
        'rsbuild.config.mjs': [
            "import { dirname, join } from 'node:path'",
            "import { fileURLToPath } from 'node:url'",
            "import { defineConfig } from '@rsbuild/core'",
            "import { pluginReact } from '@rsbuild/plugin-react'",
            "import MasterCSSPlugin from '@master/css.webpack'",
            '',
            'const root = dirname(fileURLToPath(import.meta.url))',
            '',
            'export default defineConfig({',
            '    root,',
            "    source: { entry: { index: join(root, 'src/main.jsx') } },",
            "    html: { template: join(root, 'src/index.html') },",
            "    output: { distPath: { root: 'dist' } },",
            '    plugins: [pluginReact()],',
            '    tools: {',
            '        rspack(config) {',
            '            config.plugins ||= []',
            `            config.plugins.push(new MasterCSSPlugin({ ${modeOption} }, root))`,
            '            return config',
            '        }',
            '    }',
            '})',
            ''
        ].join('\n')
    })
    return root
}

function createTanStackStartFixture() {
    const root = createFixture('tanstack-start-vite')
    writeProjectFiles(root, {
        'package.json': commonPackageJSON(),
        'tsconfig.json': JSON.stringify({
            compilerOptions: {
                target: 'ES2022',
                module: 'ESNext',
                moduleResolution: 'Bundler',
                jsx: 'react-jsx',
                strict: true,
                skipLibCheck: true,
                types: ['vite/client']
            },
            include: ['src']
        }, null, 4),
        'vite.config.ts': [
            "import { dirname } from 'node:path'",
            "import { fileURLToPath } from 'node:url'",
            "import { defineConfig } from 'vite'",
            "import { tanstackStart } from '@tanstack/react-start/plugin/vite'",
            "import react from '@vitejs/plugin-react'",
            "import masterCSS from '@master/css.vite'",
            '',
            'const root = dirname(fileURLToPath(import.meta.url))',
            '',
            'export default defineConfig({',
            '    root,',
            '    plugins: [',
            '        tanstackStart(),',
            "        masterCSS({ mode: 'static' }),",
            '        react()',
            '    ]',
            '})',
            ''
        ].join('\n'),
        'src/router.tsx': [
            "import { createRouter } from '@tanstack/react-router'",
            "import { routeTree } from './routeTree.gen'",
            '',
            'export function getRouter() {',
            '    return createRouter({',
            '        routeTree,',
            '        scrollRestoration: true',
            '    })',
            '}',
            '',
            "declare module '@tanstack/react-router' {",
            '    interface Register {',
            '        router: ReturnType<typeof getRouter>',
            '    }',
            '}',
            ''
        ].join('\n'),
        'src/routes/__root.tsx': [
            "import type { ReactNode } from 'react'",
            "import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'",
            "import '../styles/app.css'",
            '',
            'export const Route = createRootRoute({',
            '    component: RootComponent',
            '})',
            '',
            'function RootComponent() {',
            '    return (',
            '        <RootDocument>',
            '            <Outlet />',
            '        </RootDocument>',
            '    )',
            '}',
            '',
            'function RootDocument({ children }: Readonly<{ children: ReactNode }>) {',
            '    return (',
            '        <html>',
            '            <head>',
            '                <HeadContent />',
            '            </head>',
            '            <body>',
            '                {children}',
            '                <Scripts />',
            '            </body>',
            '        </html>',
            '    )',
            '}',
            ''
        ].join('\n'),
        'src/routes/index.tsx': [
            "import { createFileRoute } from '@tanstack/react-router'",
            '',
            "export const Route = createFileRoute('/')({",
            '    component: Home',
            '})',
            '',
            'function Home() {',
            '    return <main className="block fg:primary">TanStack Start fixture</main>',
            '}',
            ''
        ].join('\n'),
        'src/styles/app.css': commonStyle()
    })
    return root
}

function createTanStackStartRsbuildFixture() {
    const root = createTanStackStartFixture()
    writeProjectFiles(root, {
        'rsbuild.config.mjs': [
            "import { dirname } from 'node:path'",
            "import { fileURLToPath } from 'node:url'",
            "import { defineConfig } from '@rsbuild/core'",
            "import { tanstackStart } from '@tanstack/react-start/plugin/rsbuild'",
            "import MasterCSSPlugin from '@master/css.webpack'",
            '',
            'const root = dirname(fileURLToPath(import.meta.url))',
            '',
            'export default defineConfig({',
            '    root,',
            '    plugins: [tanstackStart()],',
            '    tools: {',
            '        rspack(config) {',
            '            config.plugins ||= []',
            "            config.plugins.push(new MasterCSSPlugin({ mode: 'static' }, root))",
            '            return config',
            '        }',
            '    }',
            '})',
            ''
        ].join('\n')
    })
    return root
}

function cleanupFixture(root: string) {
    if (process.env.KEEP_INTEGRATION_LAB_TMP) return
    rmSync(root, { recursive: true, force: true })
}

async function buildRspack(root: string) {
    const { rspack } = await import('@rspack/core')
    const { default: config } = await importFixtureModule<{ default: Parameters<typeof rspack>[0] }>(join(root, 'rspack.config.mjs'))
    await new Promise<void>((resolve, reject) => {
        rspack(config, (error, stats) => {
            if (error) {
                reject(error)
                return
            }
            if (stats?.hasErrors()) {
                reject(new Error(stats.toString({ all: false, errors: true })))
                return
            }
            resolve()
        })
    })
}

async function buildRsbuild(root: string) {
    const { createRsbuild } = await import('@rsbuild/core')
    const { default: config } = await importFixtureModule<{ default: Parameters<typeof createRsbuild>[0]['config'] }>(join(root, 'rsbuild.config.mjs'))
    const rsbuild = await createRsbuild({ cwd: root, config })
    await rsbuild.build()
}

async function buildTanStackStart(root: string) {
    const { createBuilder } = await import('vite')
    const builder = await createBuilder({
        configFile: join(root, 'vite.config.ts')
    })
    await builder.buildApp()
}

async function getOpenPort() {
    return await new Promise<number>((resolve, reject) => {
        const server = createServer()
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
            const address = server.address()
            server.close(() => {
                if (address && typeof address === 'object') resolve(address.port)
                else reject(new Error('Expected an IPv4 listener address.'))
            })
        })
    })
}

async function waitForText(url: string, expected: string, timeout = 3000) {
    const started = Date.now()
    let lastError: unknown
    while (Date.now() - started < timeout) {
        try {
            const response = await fetch(url)
            const text = await response.text()
            if (text.includes(expected)) return text
            lastError = new Error(`Response did not include ${expected}`)
        } catch (error) {
            lastError = error
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function readTanStackSSRHTML(root: string) {
    const serverEntry = [
        join(root, '.output/server/index.mjs'),
        join(root, 'dist/server/server.js')
    ].find(existsSync)
    if (!serverEntry) return undefined
    let port: number
    try {
        port = await getOpenPort()
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EPERM') return undefined
        throw error
    }
    const child = spawn(process.execPath, [serverEntry], {
        cwd: root,
        env: {
            ...process.env,
            HOST: '127.0.0.1',
            PORT: String(port),
            NITRO_HOST: '127.0.0.1',
            NITRO_PORT: String(port),
            NO_COLOR: '1'
        },
        stdio: 'ignore',
        ...process.platform === 'win32' ? { shell: true } : {}
    })
    runningProcesses.add(child)
    try {
        return await waitForText(`http://127.0.0.1:${port}/`, 'TanStack Start fixture')
    } catch {
        return undefined
    } finally {
        child.kill()
        runningProcesses.delete(child)
    }
}

describe('integration lab package', () => {
    test('does not declare webpack as a direct lab dependency', () => {
        const packageJSON = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf-8')) as {
            dependencies?: Record<string, string>
            devDependencies?: Record<string, string>
            peerDependencies?: Record<string, string>
        }
        expect(packageJSON.dependencies ?? {}).not.toHaveProperty('webpack')
        expect(packageJSON.devDependencies ?? {}).not.toHaveProperty('webpack')
        expect(packageJSON.peerDependencies ?? {}).not.toHaveProperty('webpack')
    })
})

describe('@master/css.webpack with Rspack', () => {
    test.each(['static', 'runtime'] as const)('builds a raw Rspack app in %s mode', async (mode) => {
        const root = createRspackFixture(mode)
        try {
            await buildRspack(root)
            const html = readOutputFiles(join(root, 'dist'), (path) => path.endsWith('.html'))
            const css = readOutputFiles(join(root, 'dist'), (path) => path.endsWith('.css'))
            const js = readOutputFiles(join(root, 'dist'), (path) => path.endsWith('.js'))

            expect(html).toContain('Rspack fixture')
            expectNoDuplicateRuntimeHTML(html)
            if (mode === 'static') {
                expectStaticCSS(css)
            } else {
                expect(html).toContain('master-css-runtime')
                expect(js).toContain('__MASTER_CSS_WEBPACK_RUNTIME__')
            }
        } finally {
            cleanupFixture(root)
        }
    })
})

describe('@master/css.webpack with Rsbuild', () => {
    test.each(['static', 'runtime'] as const)('builds an Rsbuild React app in %s mode', async (mode) => {
        const root = createRsbuildFixture(mode)
        try {
            await buildRsbuild(root)
            const html = readOutputFiles(join(root, 'dist'), (path) => path.endsWith('.html'))
            const css = readOutputFiles(join(root, 'dist'), (path) => path.endsWith('.css'))
            const js = readOutputFiles(join(root, 'dist'), (path) => path.endsWith('.js'))

            expect(html).toContain('root')
            expectNoDuplicateRuntimeHTML(html)
            if (mode === 'static') {
                expectStaticCSS(css)
            } else {
                expect(html).toContain('master-css-runtime')
                expect(js).toContain('__MASTER_CSS_WEBPACK_RUNTIME__')
            }
        } finally {
            cleanupFixture(root)
        }
    })
})

describe('TanStack Start with @master/css.vite', () => {
    test('builds the Vite variant with managed CSS and SSR output', async () => {
        const root = createTanStackStartFixture()
        try {
            await buildTanStackStart(root)

            const outputRoots = ['dist', '.output']
                .map((name) => join(root, name))
                .filter(existsSync)
            const allOutput = outputRoots
                .map((outputRoot) => readOutputFiles(outputRoot, (path) => /\.(css|html|js|mjs)$/.test(path)))
                .join('\n')
            const css = outputRoots
                .map((outputRoot) => readOutputFiles(outputRoot, (path) => path.endsWith('.css')))
                .join('\n')
            const html = outputRoots
                .map((outputRoot) => readOutputFiles(outputRoot, (path) => path.endsWith('.html')))
                .join('\n')
            const serverOutput = [
                join(root, '.output/server'),
                join(root, 'dist/server')
            ].map((outputRoot) => readOutputFiles(outputRoot, (path) => /\.(js|mjs)$/.test(path))).join('\n')

            expect(outputRoots.map((outputRoot) => relative(root, outputRoot))).not.toEqual([])
            expect(allOutput).toContain('TanStack Start fixture')
            expect(serverOutput).toContain('TanStack Start fixture')
            expectStaticCSS(css)
            expectNoDuplicateRuntimeHTML(html)

            const ssrHTML = await readTanStackSSRHTML(root)
            if (ssrHTML) {
                expect(ssrHTML).toContain('TanStack Start fixture')
                expect(ssrHTML).toContain('block fg:primary')
                expectNoDuplicateRuntimeHTML(ssrHTML)
            }
        } finally {
            cleanupFixture(root)
        }
    }, 30000)
})

describe('TanStack Start with Rsbuild and @master/css.webpack', () => {
    test('builds the Rsbuild variant with managed CSS and SSR output', async () => {
        const root = createTanStackStartRsbuildFixture()
        try {
            await buildRsbuild(root)

            const outputRoots = ['dist', '.output']
                .map((name) => join(root, name))
                .filter(existsSync)
            const allOutput = outputRoots
                .map((outputRoot) => readOutputFiles(outputRoot, (path) => /\.(css|html|js|mjs)$/.test(path)))
                .join('\n')
            const css = outputRoots
                .map((outputRoot) => readOutputFiles(outputRoot, (path) => path.endsWith('.css')))
                .join('\n')
            const serverOutput = [
                join(root, '.output/server'),
                join(root, 'dist/server')
            ].map((outputRoot) => readOutputFiles(outputRoot, (path) => /\.(js|mjs)$/.test(path))).join('\n')

            expect(outputRoots.map((outputRoot) => relative(root, outputRoot))).not.toEqual([])
            expect(allOutput).toContain('TanStack Start fixture')
            expect(serverOutput).toContain('TanStack Start fixture')
            expectStaticCSS(css)
        } finally {
            cleanupFixture(root)
        }
    }, 30000)
})
