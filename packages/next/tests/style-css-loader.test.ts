import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import masterCSSStyleCSSLoader from '../src/style-css-loader'

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'master-css-next-style-'))
    mkdirSync(join(root, 'app'), { recursive: true })
    return root
}

function runStyleCSSLoader(root: string, resourcePath: string, source: string) {
    const dependencies: string[] = []
    return new Promise<string>((resolve, reject) => {
        const context: ThisParameterType<typeof masterCSSStyleCSSLoader> = {
            resourcePath,
            rootContext: root,
            addDependency: (dependency) => dependencies.push(dependency),
            async: () => (error, content) => {
                if (error) {
                    const loaderError = error as Error & { dependencies?: string[] }
                    loaderError.dependencies = dependencies
                    reject(loaderError)
                } else {
                    resolve(content || '')
                }
            }
        }

        masterCSSStyleCSSLoader.call(context, source)
    }).then((content) => ({ content, dependencies }))
}

describe('Next style CSS loader', () => {
    it('derives native CSS from @master/css instead of hardcoding a package subpath', async () => {
        const root = createFixture()
        const entryPath = join(root, 'app/globals.css')
        const result = await runStyleCSSLoader(root, entryPath, '@import "@master/css";')

        expect(result.content).toContain('@layer base')
        expect(result.content).toContain('text-rendering: geometricprecision')
        expect(result.content).not.toContain('@master/css/base.css')
        expect(result.content).not.toContain('@import "@master/css"')
        expect(result.content).not.toContain('virtual:master-utilities.css')
        expect(result.dependencies).toContain(entryPath)
        expect(result.dependencies.length).toBeGreaterThan(0)
    })

    it('derives native CSS from @master entry directives', async () => {
        const root = createFixture()
        const entryPath = join(root, 'app/globals.css')
        const result = await runStyleCSSLoader(root, entryPath, '@master entry;')

        expect(result.content).toContain('@layer base')
        expect(result.content).not.toContain('@master entry;')
        expect(result.dependencies).toContain(entryPath)
    })

    it('preserves native CSS and keyframes from imported Master entry graphs', async () => {
        const root = createFixture()
        const entryPath = join(root, 'app/globals.css')
        const homePath = join(root, 'app/home.css')
        writeFileSync(homePath, [
            '@theme { --color-active: #ff0000; }',
            '@components { active-card { animation: active-spin 1s infinite; } }',
            '@keyframes active-spin { to { opacity: .5; } }',
            '.native-card { color: var(--color-active); }'
        ].join('\n'))

        const result = await runStyleCSSLoader(root, entryPath, [
            '@import "@master/css";',
            '@import "./home.css";'
        ].join('\n'))

        expect(result.content).toContain('@keyframes active-spin')
        expect(result.content).toContain('.native-card')
        expect(result.content).toContain('--color-active:red')
        expect(result.content).not.toContain('@components')
        expect(result.content).not.toContain('@import "./home.css"')
        expect(result.dependencies).toContain(entryPath)
        expect(result.dependencies).toContain(homePath)
    })

    it('leaves ordinary CSS unchanged', async () => {
        const root = createFixture()
        const source = '.card { color: red; }'
        const result = await runStyleCSSLoader(root, join(root, 'app/card.css'), source)

        expect(result.content).toBe(source)
        expect(result.dependencies).toEqual([])
    })

    it('locally lowers @compose in CSS Modules without importing package CSS', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/globals.css'), `
            @master entry;

            @components {
                brand {
                    background-color: #123456;
                }
            }
        `)
        const result = await runStyleCSSLoader(
            root,
            join(root, 'app/Button.module.css'),
            '.button { @compose inline-flex brand; color: white; }'
        )

        expect(result.content).toContain('.button{')
        expect(result.content).toContain('display:inline-flex')
        expect(result.content).toContain('background-color:#123456')
        expect(result.content).toContain('color:#fff')
        expect(result.content).not.toContain('@compose')
        expect(result.content).not.toContain('@master/css')
        expect(result.dependencies).toContain(join(root, 'app/globals.css'))
        expect(result.dependencies).toContain(join(root, 'app/Button.module.css'))
    })

    it('locally lowers explicit @reference CSS Modules without importing package CSS', async () => {
        const root = createFixture()
        const tokenPath = join(root, 'app/tokens.css')
        const modulePath = join(root, 'app/Button.module.css')
        writeFileSync(tokenPath, '@components { brand { color: #123456; } }')
        const result = await runStyleCSSLoader(
            root,
            modulePath,
            '@reference "./tokens.css"; .button { @compose brand; }'
        )

        expect(result.content).toContain('.button{color:#123456}')
        expect(result.content).not.toContain('@reference')
        expect(result.content).not.toContain('@master/css')
        expect(result.dependencies).toContain(modulePath)
        expect(result.dependencies).toContain(tokenPath)
    })

    it('keeps local style dependencies registered after invalid @compose and recovers on the next run', async () => {
        const root = createFixture()
        const modulePath = join(root, 'app/Button.module.css')
        let error: Error & { dependencies?: string[] } | undefined

        try {
            await runStyleCSSLoader(root, modulePath, '.button { @compose bg:neutral-120; }')
        } catch (caught) {
            error = caught as Error & { dependencies?: string[] }
        }
        expect(error).toBeInstanceOf(Error)
        expect(error?.message).toContain('Invalid @compose class')
        expect(error?.dependencies).toContain(modulePath)

        const result = await runStyleCSSLoader(root, modulePath, '.button { @compose block; }')

        expect(result.content).toContain('.button{display:block}')
        expect(result.dependencies).toContain(modulePath)
    })
})
