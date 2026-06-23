import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CSSScanner from '@master/css-scanner'
import { registerStyleCSSSource } from '@master/css-stylesheet'
import EmittedGlobalsVirtualModulePlugin from '../../src/plugins/emitted-globals-virtual-module'
import { RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID, VIRTUAL_EMITTED_GLOBALS_ID } from '../../src/common'

function parseDefaultExport(code: string) {
    return JSON.parse(code.replace(/^export default /, '').replace(/;$/, ''))
}

describe('EmittedGlobalsVirtualModulePlugin', () => {
    it('loads emittedGlobals counts from the managed CSS entry output', async () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-vite-emittedGlobals-'))
        try {
            mkdirSync(join(root, 'app'), { recursive: true })
            const scanner = new CSSScanner({ include: [] }, root)
            await scanner.init()
            const styleCSSSources = new Map()
            await registerStyleCSSSource(scanner, styleCSSSources, join(root, 'app/globals.css'), `
                @theme {
                    --color-primary: #ff0000;
                }

                @keyframes fade {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .main {
                    color: var(--color-primary);
                    animation-name: fade;
                }
            `, {
                projectDir: root
            })
            await scanner.scan(join(root, 'app/page.tsx'), '<main class="main"></main>')

            const context = {
                config: { root },
                scanner,
                styleCSSSources,
                includeGeneratedCSS: false
            } as any
            const plugin = EmittedGlobalsVirtualModulePlugin(context)

            await expect((plugin.resolveId as any)(VIRTUAL_EMITTED_GLOBALS_ID)).resolves.toBe(RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)
            const code = await (plugin.load as any)(RESOLVED_VIRTUAL_EMITTED_GLOBALS_ID)

            expect(parseDefaultExport(code)).toEqual({
                variables: {
                    'color-primary': 1
                },
                animations: {
                    fade: 1
                }
            })
        } finally {
            rmSync(root, { recursive: true, force: true })
        }
    })
})
