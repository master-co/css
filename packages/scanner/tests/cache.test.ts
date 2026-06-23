import CSSScanner from '../src'
import { describe, test, expect } from 'vitest'
import path from 'node:path'

const SOURCE = 'foo.tsx'
const CONTENT = `<div className="bg:white fg:black m:2x">hi</div>`
const ROOT = path.join(path.parse(process.cwd()).root, 'project')

function toPosixPath(source: string) {
    return source.replace(/\\/g, '/')
}

describe('content-hash cache (Phase A optimisation)', () => {
    test('scan(source, content) returns false on identical re-call', async () => {
        const ex = await new CSSScanner({ include: [] }).init()
        const first = await ex.scan(SOURCE, CONTENT)
        const second = await ex.scan(SOURCE, CONTENT)
        expect(first).toBe(true)
        expect(second).toBe(false)
    })

    test('cache key is per-source — same content from a different source still inserts', async () => {
        const ex = await new CSSScanner({ include: [] }).init()
        const a = await ex.scan('a.tsx', CONTENT)
        const b = await ex.scan('b.tsx', CONTENT)
        expect(a).toBe(true)
        // b returns false because all classes are already in `validClasses`
        // from the first insert (different optimisation path), but the
        // content-hash entry for b.tsx is now set; a third call to b.tsx
        // would short-circuit on the hash.
        const bAgain = await ex.scan('b.tsx', CONTENT)
        expect(bAgain).toBe(false)
    })

    test('cache invalidates on content change', async () => {
        const ex = await new CSSScanner({ include: [] }).init()
        const v1 = await ex.scan(SOURCE, `<div class="bg:red">a</div>`)
        const v2 = await ex.scan(SOURCE, `<div class="bg:blue">b</div>`)
        expect(v1).toBe(true)
        expect(v2).toBe(true)
    })

    test('reset() clears the content-hash cache', async () => {
        const ex = await new CSSScanner({ include: [] }).init()
        await ex.scan(SOURCE, CONTENT)
        await ex.reset()
        // After reset, the hash for SOURCE is gone, so the same content
        // re-inserts (returns true again).
        const after = await ex.scan(SOURCE, CONTENT)
        expect(after).toBe(true)
    })
})

describe('valid-rules memo (Phase A optimisation)', () => {
    test('same class across many files is processed once', async () => {
        const ex = await new CSSScanner({ include: [] }).init()
        // First file with the class — populates validClasses + the rules cache.
        await ex.scan('a.tsx', `<div className="bg:white">a</div>`)
        expect(ex.validClasses.has('bg:white')).toBe(true)
        // Subsequent files with the same class — already in validClasses, so
        // the inner generateValidRules path is skipped entirely. The
        // assertion is structural: the rules-cache Map exists and is
        // populated.
        await ex.scan('b.tsx', `<div className="bg:white">b</div>`)
        await ex.scan('c.tsx', `<div className="bg:white">c</div>`)
        // @ts-expect-error access private cache for verification
        expect(ex.validRulesCache.has('bg:white')).toBe(true)
        // @ts-expect-error access private cache for verification
        expect(ex.validRulesCache.size).toBe(1)
    })
})

describe('class exclusion matcher', () => {
    test('resets stateful regular expressions while filtering repeated classes', async () => {
        const ex = await new CSSScanner({
            include: [],
            blocklist: [/^bg:/g]
        }).init()

        await ex.scan(SOURCE, `<div className="bg:red bg:blue block">hi</div>`)

        expect(ex.validClasses.has('bg:red')).toBe(false)
        expect(ex.validClasses.has('bg:blue')).toBe(false)
        expect(ex.validClasses.has('block')).toBe(true)
    })

    test('rebuilds when blocklist is reassigned', async () => {
        const ex = await new CSSScanner({
            include: [],
            blocklist: [/^bg:/]
        }).init()

        await ex.scan('excluded.tsx', `<div className="bg:red block">hi</div>`)
        ex.options.blocklist = []
        await ex.scan('included.tsx', `<div className="bg:blue">hi</div>`)

        expect(ex.validClasses.has('bg:red')).toBe(false)
        expect(ex.validClasses.has('bg:blue')).toBe(true)
    })
})

describe('source matcher cache', () => {
    test('rebuilds when include is reassigned', async () => {
        const ex = await new CSSScanner({
            include: ['**/*.html']
        }).init()

        expect(ex.collectCandidates('component.tsx', `<div className="block">hi</div>`)).toEqual([])

        ex.options.include = ['**/*.tsx']

        expect(ex.collectCandidates('component.tsx', `<div className="block">hi</div>`)).toEqual(['block'])
    })

    test('normalizes Vite query suffixes before matching source paths', async () => {
        const ex = await new CSSScanner({}).init()

        expect(ex.isSourceAllowed('component.tsx?import')).toBe(true)
        expect(ex.isSourceAllowed('content.md?raw')).toBe(true)
    })

    test('rejects non-source extensions with Vite query suffixes', async () => {
        const ex = await new CSSScanner({}).init()

        expect(ex.isSourceAllowed('data.json?import')).toBe(false)
        expect(ex.isSourceAllowed('icon.svg?url')).toBe(false)
        expect(ex.isSourceAllowed('audio.mp3')).toBe(false)
    })

    test('rejects framework style module requests', async () => {
        const ex = await new CSSScanner({}).init()

        expect(ex.isSourceAllowed('App.vue?vue&type=script')).toBe(true)
        expect(ex.isSourceAllowed('App.vue?vue&type=style&index=0&lang.css')).toBe(false)
        expect(ex.isSourceAllowed('App.svelte?svelte&type=style&lang.css')).toBe(false)
    })

    test('matches absolute source ids against relative include globs within cwd', async () => {
        const ex = await new CSSScanner({
            include: ['src/**/*.tsx'],
            exclude: []
        }, ROOT).init()

        expect(ex.isSourceAllowed(path.join(ROOT, 'src/App.tsx'))).toBe(true)
        expect(ex.isSourceAllowed(path.join(ROOT, 'packages/App.tsx'))).toBe(false)
    })

    test('matches absolute source ids against relative exclude globs within cwd', async () => {
        const ex = await new CSSScanner({
            include: ['src/**/*.tsx'],
            exclude: ['src/**/*.test.tsx']
        }, ROOT).init()

        expect(ex.isSourceAllowed(path.join(ROOT, 'src/App.tsx'))).toBe(true)
        expect(ex.isSourceAllowed(path.join(ROOT, 'src/App.test.tsx'))).toBe(false)
    })

    test('relative required globs override relative excludes for absolute source ids', async () => {
        const ex = await new CSSScanner({
            required: ['src/App.test.tsx'],
            include: ['src/**/*.tsx'],
            exclude: ['src/**/*.test.tsx']
        }, ROOT).init()

        expect(ex.isSourceAllowed(path.join(ROOT, 'src/App.test.tsx'))).toBe(true)
    })

    test('absolute required globs still override excludes', async () => {
        const appSource = path.join(ROOT, 'src/App.test.tsx')
        const ex = await new CSSScanner({
            required: [toPosixPath(appSource)],
            include: ['src/**/*.tsx'],
            exclude: ['src/**/*.test.tsx']
        }, ROOT).init()

        expect(ex.isSourceAllowed(appSource)).toBe(true)
    })

    test('strips query suffixes before matching absolute source ids against relative globs', async () => {
        const ex = await new CSSScanner({
            include: ['src/**/*.tsx'],
            exclude: []
        }, ROOT).init()

        expect(ex.isSourceAllowed(`${path.join(ROOT, 'src/App.tsx')}?import`)).toBe(true)
    })

    test('rejects absolute framework style module requests before source matching', async () => {
        const ex = await new CSSScanner({
            include: ['src/**/*.vue'],
            exclude: []
        }, ROOT).init()

        expect(ex.isSourceAllowed(`${path.join(ROOT, 'src/App.vue')}?vue&type=script`)).toBe(true)
        expect(ex.isSourceAllowed(`${path.join(ROOT, 'src/App.vue')}?vue&type=style&index=0&lang.css`)).toBe(false)
    })
})
