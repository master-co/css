import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import CSSExtractor from '../src/core'
import { collectExtractorDirectives } from '../src/directives'
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
            @master source './exclude/**/*.tsx';
            @master source exclude './src/**/*.test.tsx';
            @master source force './src/force-exclude.tsx';
            @master class 'not-exclude';
            @master class exclude 'legacy-*';
        `, join(root, 'master.css'), root)

        expect(directives.include).toEqual(['exclude/**/*.tsx'])
        expect(directives.exclude).toEqual(['src/**/*.test.tsx'])
        expect(directives.sources).toEqual(['src/force-exclude.tsx'])
        expect(directives.includeClasses).toEqual(['not-exclude'])
        expect(directives.excludeClasses[0]).toBeInstanceOf(RegExp)
        expect((directives.excludeClasses[0] as RegExp).test('legacy-card')).toBe(true)
    })

    it('loads global extractor directives from the master.css config graph', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'master.css'), `
            @master source './app/**/*.tsx';
            @master source exclude './app/**/*.test.tsx';
            @master source force './app/forced.test.tsx';
            @master class 'font:semibold legacy-token';
            @master class exclude 'legacy-*';
        `)
        writeFileSync(join(root, 'app/page.tsx'), '<div class="block"></div>')
        writeFileSync(join(root, 'app/skip.test.tsx'), '<div class="text:center"></div>')
        writeFileSync(join(root, 'app/forced.test.tsx'), '<div class="fg:red"></div>')

        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()
        await extractor.prepare()

        expect(extractor.extractorDirectives.include).toEqual(['app/**/*.tsx'])
        expect(extractor.extractorDirectives.exclude).toEqual(['app/**/*.test.tsx'])
        expect(extractor.extractorDirectives.sources).toEqual(['app/forced.test.tsx'])
        expect(extractor.options.include).toContain('app/**/*.tsx')
        expect(extractor.options.exclude).toContain('app/**/*.test.tsx')
        expect(extractor.options.sources).toContain('app/forced.test.tsx')
        expect(extractor.options.includeClasses).toContain('font:semibold')
        expect(extractor.options.includeClasses).toContain('legacy-token')
        expect(extractor.css.text).toContain('.block{display:block}')
        expect(extractor.css.text).toContain('.fg\\:red{color:var(--color-red)}')
        expect(extractor.css.text).toContain('.font\\:semibold{font-weight:var(--font-weight-semibold)}')
        expect(extractor.css.text).not.toContain('.text\\:center')
        expect(extractor.css.text).not.toContain('legacy-token')
    })

    it('uses stylesheet-local source directives for a shaken CSS root', async () => {
        const root = createFixture()
        writeFileSync(join(root, 'master.css'), '@master {}')
        writeFileSync(join(root, 'app/a/page.tsx'), '<div class="card"></div>')
        writeFileSync(join(root, 'app/b/page.tsx'), '<div class="unused"></div>')
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
        }, root)
        await extractor.init()

        const styleCSSSources = new Map()
        const result = await registerStyleCSSSource(extractor, styleCSSSources, join(root, 'app/a/a.css'), `
            @import "@master/css";
            @master source './*.tsx';

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
        writeFileSync(join(root, 'master.css'), '@master {}')
        writeFileSync(join(root, 'app/shared.css'), `
            @master class 'shared-card legacy-card';
            @master class exclude 'legacy-*';

            .shared-card {
                color: red;
            }

            .legacy-card {
                color: blue;
            }
        `)
        const extractor = new CSSExtractor({
            include: [],
            config: 'master.css'
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
        expect(css).not.toContain('@master class')
    })
})
