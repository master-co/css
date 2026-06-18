import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CSSExtractor from '../src/core'
import { collectExtractorDirectives, removeExtractorDirectiveStatements } from '../src/directives'
import {
    createExtractedCSS,
    registerStyleCSSSource
} from '../src/style'

function createFixture() {
    const root = mkdtempSync(join(tmpdir(), 'master-css-extractor-directives-'))
    mkdirSync(join(root, 'app/a'), { recursive: true })
    mkdirSync(join(root, 'app/b'), { recursive: true })
    return root
}

describe('extractor CSS directives', () => {
    it('reads directive modifiers outside quoted strings', () => {
        const root = createFixture()
        const directives = collectExtractorDirectives(`
            @source './exclude/**/*.tsx';
            @source not './src/**/*.test.tsx';
            @source required './src/force-exclude.tsx';
            @safelist 'not-exclude';
            @blocklist 'legacy-*';
            @preserve native;
        `, join(root, 'app/entry.css'), root)

        expect(directives.include).toEqual(['app/exclude/**/*.tsx'])
        expect(directives.exclude).toEqual(['app/src/**/*.test.tsx'])
        expect(directives.required).toEqual(['app/src/force-exclude.tsx'])
        expect(directives.safelist).toEqual(['not-exclude'])
        expect(directives.blocklist[0]).toBeInstanceOf(RegExp)
        expect((directives.blocklist[0] as RegExp).test('legacy-card')).toBe(true)
        expect(directives.preserveNative).toBe(true)
    })

    it('does not collect non-entry @master at-rules as extraction directives', () => {
        const source = `
            @master source './src/**/*.tsx';
            @master source exclude './src/**/*.test.tsx';
            @master source force './src/generated.tsx';
            @master class 'not-exclude';
            @master class exclude 'legacy-*';
            @master no-shake;
        `
        const directives = collectExtractorDirectives(source)
        const result = removeExtractorDirectiveStatements(source)

        expect(directives).toEqual({
            include: [],
            exclude: [],
            required: [],
            safelist: [],
            blocklist: [],
            preserveNative: false
        })
        expect(result.removed).toBe(false)
        expect(result.code).toContain('@master source')
        expect(result.code).toContain('@master class')
        expect(result.code).toContain('@master no-shake')
    })

    it('loads extractor directives from a managed CSS entry graph', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/page.tsx'), '<div class="block"></div>')
        writeFileSync(join(root, 'app/skip.test.tsx'), '<div class="text-center"></div>')
        writeFileSync(join(root, 'app/forced.test.tsx'), '<div class="fg:red"></div>')

        const extractor = new CSSExtractor({
            include: []
        }, root)
        await extractor.init()
        const styleCSSSources = new Map()
        await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/entry.css'), `
            @master;
            @source './**/*.tsx';
            @source not './**/*.test.tsx';
            @source required './forced.test.tsx';
            @safelist 'font:semibold legacy-token';
            @blocklist 'legacy-*';
        `)
        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            projectDir: root
        })

        expect(css).toContain('.block{display:block}')
        expect(css).toContain('.fg\\:red{color:var(--color-red)}')
        expect(css).toContain('.font\\:semibold{font-weight:var(--font-weight-semibold)}')
        expect(css).not.toContain('.text\\:center')
        expect(css).not.toContain('legacy-token')
    })

    it('uses stylesheet-local source directives for a pruned CSS root', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/a/page.tsx'), '<div class="card"></div>')
        writeFileSync(join(root, 'app/b/page.tsx'), '<div class="unused"></div>')
        const extractor = new CSSExtractor({
            include: []
        }, root)
        await extractor.init()

        const styleCSSSources = new Map()
        const result = await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/a/a.css'), `
            @import "@master/css";
            @source './*.tsx';

            .card {
                color: red;
            }

            .unused {
                color: blue;
            }
        `)

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            includeGeneratedCSS: false,
            projectDir: root
        })

        expect(result.dependencies).toContain(join(root, 'app/a/page.tsx'))
        expect(css).toContain('.card')
        expect(css).not.toContain('.unused')
    })

    it('merges imported stylesheet class directives into the parent root scope', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'app/shared.css'), `
            @safelist 'shared-card legacy-card';
            @blocklist 'legacy-*';

            .shared-card {
                color: red;
            }

            .legacy-card {
                color: blue;
            }
        `)
        const extractor = new CSSExtractor({
            include: []
        }, root)
        await extractor.init()

        const styleCSSSources = new Map()
        await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/a/a.css'), `
            @import "@master/css";
            @import '../shared.css';
        `)

        const css = await createExtractedCSS({
            extractor,
            styleCSSSources,
            includeGeneratedCSS: false,
            projectDir: root
        })

        expect(css).toContain('.shared-card')
        expect(css).not.toContain('.legacy-card')
        expect(css).not.toContain('@safelist')
    })
})
