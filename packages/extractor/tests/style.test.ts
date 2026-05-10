import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CSSExtractor from '../src/core'
import {
    createExtractedCSS,
    isMasterStyleSource,
    registerStyleCSSSource,
    replaceStyleCSSImports
} from '../src/style'

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'master-css-extractor-style-'))
    mkdirSync(join(root, 'app'), { recursive: true })
    writeFileSync(join(root, 'master.css'), '@master {}')
    return root
}

describe('style CSS extraction helpers', () => {
    it('replaces virtual CSS imports with CSS import modifiers', () => {
        const result = replaceStyleCSSImports([
            '@import "virtual:master.css";',
            '@import url(\'master.css\') layer(master);',
            '@import "./other.css";'
        ].join('\n'), 'virtual:master.css', '/* master */')

        expect(result.replaced).toBe(true)
        expect(result.code).toContain('/* master */')
        expect(result.code).not.toContain('virtual:master.css')
        expect(result.code).not.toContain('layer(master)')
        expect(result.code).toContain('@import "./other.css";')
    })

    it('detects virtual CSS imports only', () => {
        expect(isMasterStyleSource('@master { --color-primary: red; }', 'virtual:master.css')).toBe(false)
        expect(isMasterStyleSource('@import "master.css";', 'virtual:master.css')).toBe(true)
        expect(isMasterStyleSource('@import "./other.css";', 'virtual:master.css')).toBe(false)
    })

    it('uses root master.css config only and ignores stylesheet-local CSS config sources', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'master.css'), `
            .root-native {
                color: red;
            }

            @master {
                --color-primary: #ff0000;

                @keyframes fade {
                    from {
                        opacity: 0;
                    }

                    to {
                        opacity: 1;
                    }
                }

                .btn {
                    display: grid;
                }
            }
        `)
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css',
            module: 'virtual:master.css'
        }, root)
        await extractor.init()
        await extractor.prepare()

        const styleCSSSources = new Map<string, string>()
        await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/globals.css'), `
            @import "virtual:master.css";

            @master {
                .btn {
                    display: inline-flex;
                }
            }

            .main {
                color: var(--color-primary);
                animation-name: fade;
            }

            .unused {
                color: var(--color-primary);
            }
        `)
        await extractor.insert(join(root, 'app/page.tsx'), '<main class="btn block main"></main>')

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            projectDir: root
        })

        expect(css).not.toContain('.root-native')
        expect(css).toContain('.main')
        expect(css).not.toContain('.unused')
        expect(css).toContain('--color-primary:red')
        expect(css).toContain('@keyframes fade')
        expect(css).toContain('.btn{display:grid}')
        expect(css).not.toContain('.btn{display:inline-flex}')
        expect(css).toContain('.block{display:block}')
        expect(css).not.toContain('@master')
        expect(css).not.toContain('virtual:master.css')
    })
})
