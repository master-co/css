import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CSSExtractor from '@master/css-extractor'
import { registerStyleCSSSource } from '@master/css-extractor/style'
import PreloadedVirtualModulePlugin from '../../src/plugins/preloaded-virtual-module'
import { RESOLVED_VIRTUAL_PRELOADED_ID, VIRTUAL_PRELOADED_ID } from '../../src/common'

function parseDefaultExport(code: string) {
    return JSON.parse(code.replace(/^export default /, '').replace(/;$/, ''))
}

describe('PreloadedVirtualModulePlugin', () => {
    it('loads preloaded counts from the managed CSS entry output', async () => {
        const root = mkdtempSync(join(tmpdir(), 'master-css-vite-preloaded-'))
        try {
            mkdirSync(join(root, 'app'), { recursive: true })
            const extractor = new CSSExtractor({ include: [] }, root)
            await extractor.init()
            const styleCSSSources = new Map()
            await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/globals.css'), `
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
            await extractor.insert(join(root, 'app/page.tsx'), '<main class="main"></main>')

            const context = {
                config: { root },
                extractor,
                styleCSSSources,
                includeGeneratedCSS: false
            } as any
            const plugin = PreloadedVirtualModulePlugin(context)

            await expect((plugin.resolveId as any)(VIRTUAL_PRELOADED_ID)).resolves.toBe(RESOLVED_VIRTUAL_PRELOADED_ID)
            const code = await (plugin.load as any)(RESOLVED_VIRTUAL_PRELOADED_ID)

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
