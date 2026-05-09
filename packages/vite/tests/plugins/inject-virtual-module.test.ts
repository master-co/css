import { describe, expect, it } from 'vitest'
import InjectVirtualModulePlugin from '../../src/plugins/inject-virtual-module'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const ENTRY_ID = '/project/src/main.ts'

function createPlugin() {
    return InjectVirtualModulePlugin({} as any, {
        entryId: ENTRY_ID,
        extractor: {
            options: {
                module: 'virtual:master.css'
            }
        } as any
    } as any)
}

describe('InjectVirtualModulePlugin', () => {
    it('does not inject a duplicate virtual CSS import', async () => {
        const plugin = createPlugin()
        const code = `import 'virtual:master.css'\nconsole.log('ready')`
        const result = await (plugin.transform as any).call({ resolve: async () => null }, code, ENTRY_ID)

        expect(result).toBeNull()
    })

    it('injects the virtual CSS import when the entry does not import it', async () => {
        const plugin = createPlugin()
        const result = await (plugin.transform as any).call({ resolve: async () => null }, `console.log('ready')`, ENTRY_ID)

        expect(result.code).toContain(`import 'virtual:master.css'`)
        expect(result.code).toContain('/*__MASTER_CSS_VIRTUAL_MODULE_INJECTED__*/')
    })

    it('does not auto-inject when the entry imports CSS that imports the virtual module', async () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-inject-'))
        try {
            const entry = path.join(root, 'src/main.ts')
            const css = path.join(root, 'src/style.css')
            mkdirSync(path.dirname(css), { recursive: true })
            writeFileSync(css, `@import 'virtual:master.css';`)

            const plugin = InjectVirtualModulePlugin({} as any, {
                entryId: entry,
                extractor: {
                    options: {
                        module: 'virtual:master.css'
                    }
                } as any
            } as any)
            const result = await (plugin.transform as any).call(
                { resolve: async () => ({ id: css }) },
                `import './style.css'\nconsole.log('ready')`,
                entry
            )

            expect(result).toBeNull()
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })

    it('removes a manual side-effect virtual import when CSS already imports the virtual module', async () => {
        const root = mkdtempSync(path.join(tmpdir(), 'master-css-vite-inject-'))
        try {
            const entry = path.join(root, 'src/main.ts')
            const css = path.join(root, 'src/style.css')
            mkdirSync(path.dirname(css), { recursive: true })
            writeFileSync(css, `@import 'virtual:master.css';`)

            const plugin = InjectVirtualModulePlugin({} as any, {
                entryId: entry,
                extractor: {
                    options: {
                        module: 'virtual:master.css'
                    }
                } as any
            } as any)
            const result = await (plugin.transform as any).call(
                { resolve: async () => ({ id: css }) },
                `import 'virtual:master.css'\nimport './style.css'\nconsole.log('ready')`,
                entry
            )

            expect(result.code).not.toContain(`import 'virtual:master.css'`)
            expect(result.code).toContain(`import './style.css'`)
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
