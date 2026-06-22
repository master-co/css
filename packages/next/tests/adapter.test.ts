import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createComposedAdapter, renderNextBuildOutputs } from '../src/adapter'
import type { NextAdapter } from 'next'
import { MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID } from 'shared/master-css-hydration-manifest'

type BuildCompleteContext = Parameters<NonNullable<NextAdapter['onBuildComplete']>>[0]

let fixtureDir: string | undefined

function createFixtureDir() {
    fixtureDir = mkdtempSync(join(tmpdir(), 'master-css-next-'))
    return fixtureDir
}

function createBuildContext(projectDir: string, htmlFile: string): BuildCompleteContext {
    const distDir = join(projectDir, '.next')
    return {
        projectDir,
        repoRoot: projectDir,
        distDir,
        nextVersion: '16.2.4',
        buildId: 'test-build',
        routing: {
            beforeMiddleware: [],
            beforeFiles: [],
            afterFiles: [],
            dynamicRoutes: [],
            onMatch: [],
            fallback: [],
            shouldNormalizeNextData: false,
            rsc: {}
        },
        config: {},
        outputs: {
            pages: [],
            middleware: undefined,
            appPages: [],
            pagesApi: [],
            appRoutes: [],
            staticFiles: [
                {
                    id: 'index',
                    type: 'STATIC_FILE',
                    filePath: htmlFile,
                    pathname: '/',
                    immutableHash: undefined
                },
                {
                    id: 'asset',
                    type: 'STATIC_FILE',
                    filePath: join(distDir, 'app.js'),
                    pathname: '/app.js',
                    immutableHash: undefined
                }
            ],
            prerenders: [
                {
                    id: 'fallback',
                    type: 'PRERENDER',
                    parentOutputId: 'index',
                    groupId: 0,
                    pathname: '/',
                    fallback: {
                        filePath: htmlFile,
                        postponedState: undefined
                    },
                    config: {}
                }
            ]
        }
    } as unknown as BuildCompleteContext
}

function countHydrationManifestScripts(html: string) {
    return html.match(new RegExp(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
}

function readMasterStyle(html: string) {
    return html.match(/<style id="master-css">([\s\S]*?)<\/style>/)?.[1] ?? ''
}

afterEach(() => {
    if (fixtureDir) {
        rmSync(fixtureDir, { recursive: true, force: true })
        fixtureDir = undefined
    }
})

describe('renderNextBuildOutputs', () => {
    it('renders Master CSS into static HTML outputs once', async () => {
        const projectDir = createFixtureDir()
        const distDir = join(projectDir, '.next')
        const htmlFile = join(distDir, 'server/app/index.html')
        mkdirSync(join(distDir, 'server/app'), { recursive: true })
        writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="font:40px fg:red">Hello</h1></body></html>')

        const outputs = await renderNextBuildOutputs(
            createBuildContext(projectDir, htmlFile),
            { buildReport: true }
        )
        const html = readFileSync(htmlFile, 'utf-8')

        expect(outputs).toHaveLength(1)
        expect(outputs[0].classes).toEqual(['font:40px', 'fg:red'])
        expect(outputs[0].rendered).toBe(true)
        expect(html).toContain('<style id="master-css">')
        expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
        expect(html).toContain('"className":"font:40px"')
        expect(html).toContain('"className":"fg:red"')
        expect(countHydrationManifestScripts(html)).toBe(1)
        expect(html).toContain('.font\\:40px')
        expect(html).toContain('.fg\\:red')
        expect(existsSync(join(distDir, 'master-css-build-report.json'))).toBe(true)
    })

    it('does not write empty Master CSS for non-Master classes', async () => {
        const projectDir = createFixtureDir()
        const distDir = join(projectDir, '.next')
        const htmlFile = join(distDir, 'server/pages/404.html')
        const sourceHTML = '<!doctype html><html><head></head><body><h1 class="next-error-h1">404</h1></body></html>'
        mkdirSync(join(distDir, 'server/pages'), { recursive: true })
        writeFileSync(htmlFile, sourceHTML)

        const outputs = await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))
        const html = readFileSync(htmlFile, 'utf-8')

        expect(outputs[0].classes).toEqual(['next-error-h1'])
        expect(outputs[0].cssBytes).toBe(0)
        expect(outputs[0].rendered).toBe(false)
        expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
        expect(html).toBe(sourceHTML)
    })

    it('does not inline native-only managed CSS entry output', async () => {
        const projectDir = createFixtureDir()
        const distDir = join(projectDir, '.next')
        const htmlFile = join(distDir, 'server/app/index.html')
        const sourceHTML = '<!doctype html><html><head></head><body><button class="btn native-used root-native">Button</button></body></html>'
        mkdirSync(join(distDir, 'server/app'), { recursive: true })
        mkdirSync(join(projectDir, 'src'), { recursive: true })
        writeFileSync(join(projectDir, 'src/styles.scss'), [
            '$accent: #123;',
            '',
            '.native-used {',
            '    color: $accent;',
            '}',
            '',
            '.native-unused {',
            '    color: #456;',
            '}',
            '',
            '@layer components {',
            '    .btn {',
            '        display: inline-flex;',
            '    }',
            '}'
        ].join('\n'))
        writeFileSync(join(projectDir, 'app.css'), [
            '@master;',
            '',
            '.root-native {',
            '    color: #789;',
            '}',
            '',
            '.root-unused {',
            '    color: #abc;',
            '}',
            '',
            '@layer components {',
            '    .btn {',
            '        display: grid;',
            '    }',
            '}'
        ].join('\n'))
        writeFileSync(htmlFile, sourceHTML)

        const outputs = await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))
        const html = readFileSync(htmlFile, 'utf-8')

        expect(outputs[0].rendered).toBe(false)
        expect(outputs[0].cssBytes).toBe(0)
        expect(html).toBe(sourceHTML)
        expect(html).not.toContain('<style id="master-css">')
        expect(html).not.toContain('data-master-css')
        expect(html).not.toContain(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)
    })

    it('keeps only generated CSS in style#master-css when native CSS is also present', async () => {
        const projectDir = createFixtureDir()
        const distDir = join(projectDir, '.next')
        const htmlFile = join(distDir, 'server/app/index.html')
        mkdirSync(join(distDir, 'server/app'), { recursive: true })
        writeFileSync(join(projectDir, 'app.css'), [
            '@master;',
            '',
            '.root-native {',
            '    color: #789;',
            '}'
        ].join('\n'))
        writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="root-native fg:red">Hello</h1></body></html>')

        const outputs = await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))
        const html = readFileSync(htmlFile, 'utf-8')
        const masterStyle = readMasterStyle(html)

        expect(outputs[0].rendered).toBe(true)
        expect(masterStyle).toContain('.fg\\:red')
        expect(masterStyle).not.toContain('.root-native')
        expect(html).not.toContain('data-master-css')
        expect(html).toContain(`id="${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}"`)
        expect(html).toContain('"className":"fg:red"')
        expect(html).not.toContain('"className":"root-native"')
    })
})

describe('createComposedAdapter', () => {
    it('runs the Master CSS adapter before the external adapter by default', async () => {
        const calls: string[] = []
        const adapter = createComposedAdapter(
            {
                name: 'master',
                async onBuildComplete() {
                    calls.push('master')
                }
            },
            async () => ({
                default: {
                    name: 'external',
                    async onBuildComplete() {
                        calls.push('external')
                    }
                }
            })
        )

        await adapter.onBuildComplete?.({} as BuildCompleteContext)

        expect(calls).toEqual(['master', 'external'])
    })

    it('can run the external adapter before the Master CSS adapter', async () => {
        const calls: string[] = []
        const adapter = createComposedAdapter(
            {
                name: 'master',
                async onBuildComplete() {
                    calls.push('master')
                }
            },
            {
                name: 'external',
                async onBuildComplete() {
                    calls.push('external')
                }
            },
            { order: 'external-first' }
        )

        await adapter.onBuildComplete?.({} as BuildCompleteContext)

        expect(calls).toEqual(['external', 'master'])
    })
})
