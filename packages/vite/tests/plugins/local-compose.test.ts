import { describe, expect, test, vi } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import LocalComposePlugin from '../../src/plugins/local-compose'

function createFixture() {
    const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-local-compose-'))
    mkdirSync(path.join(root, 'src'), { recursive: true })
    writeFileSync(path.join(root, 'app.css'), `
        @master;

        @components {
            brand {
                background-color: #123456;
            }
        }
    `)
    return root
}

function createContext(root: string) {
    return {
        config: {
            root,
            server: {
                fs: {
                    allow: []
                }
            }
        }
    } as any
}

describe('LocalComposePlugin', () => {
    test('lowers @compose in CSS Modules without emitting a Master CSS slot', async () => {
        const root = createFixture()
        try {
            const context = createContext(root)
            const plugin = LocalComposePlugin({} as any, context)
            const addWatchFile = vi.fn()
            await (plugin as any).buildStart.call({})

            const result = await (plugin as any).transform.call(
                { addWatchFile },
                '.button { @compose "inline-flex brand"; color: white; }',
                path.join(root, 'src/Button.module.css')
            )

            expect(result.code).toContain('.button{')
            expect(result.code).toContain('display:inline-flex')
            expect(result.code).toContain('background-color:#123456')
            expect(result.code).toContain('color:#fff')
            expect(result.code).not.toContain('@compose')
            expect(result.code).not.toContain('master-css-slot')
            expect(addWatchFile).toHaveBeenCalledWith(path.join(root, 'app.css'))
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    test('leaves ordinary CSS and Master entries to their existing pipelines', async () => {
        const root = createFixture()
        try {
            const context = createContext(root)
            const plugin = LocalComposePlugin({} as any, context)

            expect(await (plugin as any).transform.call(
                {},
                '.button { color: red; }',
                path.join(root, 'src/Button.module.css')
            )).toBeUndefined()
            expect(await (plugin as any).transform.call(
                {},
                '@master; .button { @compose "block"; }',
                path.join(root, 'src/app.css')
            )).toBeUndefined()
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    test('lowers @compose in SFC style requests', async () => {
        const root = createFixture()
        try {
            const context = createContext(root)
            const plugin = LocalComposePlugin({} as any, context)

            const result = await (plugin as any).transform.call(
                { addWatchFile: vi.fn() },
                '.button { @compose "block"; }',
                path.join(root, 'src/Button.vue') + '?vue&type=style&index=0&lang.css'
            )

            expect(result.code).toBe('.button{display:block}')
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
