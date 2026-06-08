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
                    reject(error)
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
        const result = await runStyleCSSLoader(root, entryPath, '@master;')

        expect(result.content).toContain('@layer base')
        expect(result.content).not.toContain('@master;')
        expect(result.dependencies).toContain(entryPath)
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
            @master;

            @layer components {
                .brand {
                    background-color: #123456;
                }
            }
        `)
        const result = await runStyleCSSLoader(
            root,
            join(root, 'app/Button.module.css'),
            '.button { @compose "inline-flex brand"; color: white; }'
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
})
