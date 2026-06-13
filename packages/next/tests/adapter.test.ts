import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { renderNextBuildOutputs } from '../src/adapter'
import type { NextAdapter } from 'next'
import { MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID } from 'shared/master-css-runtime-manifest'

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

function countManifestScripts(html: string) {
    return html.match(new RegExp(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`, 'g'))?.length ?? 0
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
        writeFileSync(htmlFile, '<!doctype html><html><head></head><body><h1 class="font:40 fg:red">Hello</h1></body></html>')

        const outputs = await renderNextBuildOutputs(
            createBuildContext(projectDir, htmlFile),
            { manifest: true }
        )
        const html = readFileSync(htmlFile, 'utf-8')

        expect(outputs).toHaveLength(1)
        expect(outputs[0].classes).toEqual(['font:40', 'fg:red'])
        expect(outputs[0].rendered).toBe(true)
        expect(html).toContain('<style id="master">')
        expect(html).toContain(`id="${MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID}"`)
        expect(html).toContain('"className":"font:40"')
        expect(html).toContain('"className":"fg:red"')
        expect(countManifestScripts(html)).toBe(1)
        expect(html).toContain('.font\\:40')
        expect(html).toContain('.fg\\:red')
        expect(existsSync(join(distDir, 'master-css-manifest.json'))).toBe(true)
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
        expect(html).not.toContain(MASTER_CSS_RUNTIME_MANIFEST_SCRIPT_ID)
        expect(html).toBe(sourceHTML)
    })

    it('uses the managed CSS entry config and native CSS only', async () => {
        const projectDir = createFixtureDir()
        const distDir = join(projectDir, '.next')
        const htmlFile = join(distDir, 'server/app/index.html')
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
        writeFileSync(htmlFile, '<!doctype html><html><head></head><body><button class="btn native-used root-native">Button</button></body></html>')

        const outputs = await renderNextBuildOutputs(createBuildContext(projectDir, htmlFile))
        const html = readFileSync(htmlFile, 'utf-8')

        expect(outputs[0].rendered).toBe(true)
        expect(html).not.toContain('.native-used')
        expect(html).not.toContain('.native-unused')
        expect(html).toContain('.root-native')
        expect(html).not.toContain('.root-unused')
        expect(html).toContain('.btn')
        expect(html).toContain('display: grid')
        expect(html).not.toContain('display: inline-flex')
    })
})
