import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import withMasterCSS from '../src'
import { renderNextBuildOutputs } from '../src/adapter'
import { getRegisteredOptions } from '../src/options'
import type { NextAdapter } from 'next'

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
        expect(html).toBe(sourceHTML)
    })
})

describe('withMasterCSS', () => {
    it('sets the Next adapter path and registers options', () => {
        const nextConfig = withMasterCSS({ reactStrictMode: true }, { manifest: 'master-css.json' })

        expect(nextConfig.reactStrictMode).toBe(true)
        expect(nextConfig.adapterPath).toContain('adapter.mjs')
        expect(getRegisteredOptions()).toEqual({ manifest: 'master-css.json' })
    })

    it('returns the Next config unchanged when mode is null', () => {
        const nextConfig = { reactStrictMode: true }

        expect(withMasterCSS(nextConfig, { mode: null })).toBe(nextConfig)
    })
})
