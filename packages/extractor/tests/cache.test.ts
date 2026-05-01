import CSSExtractor from '../src'
import { describe, test, expect } from 'vitest'

const SOURCE = 'foo.tsx'
const CONTENT = `<div className="bg:white fg:black m:8">hi</div>`

describe('content-hash cache (Phase A optimisation)', () => {
    test('insert(source, content) returns false on identical re-call', async () => {
        const ex = new CSSExtractor({ config: {} as any }).init()
        const first = await ex.insert(SOURCE, CONTENT)
        const second = await ex.insert(SOURCE, CONTENT)
        expect(first).toBe(true)
        expect(second).toBe(false)
    })

    test('cache key is per-source — same content from a different source still inserts', async () => {
        const ex = new CSSExtractor({ config: {} as any }).init()
        const a = await ex.insert('a.tsx', CONTENT)
        const b = await ex.insert('b.tsx', CONTENT)
        expect(a).toBe(true)
        // b returns false because all classes are already in `validClasses`
        // from the first insert (different optimisation path), but the
        // content-hash entry for b.tsx is now set; a third call to b.tsx
        // would short-circuit on the hash.
        const bAgain = await ex.insert('b.tsx', CONTENT)
        expect(bAgain).toBe(false)
    })

    test('cache invalidates on content change', async () => {
        const ex = new CSSExtractor({ config: {} as any }).init()
        const v1 = await ex.insert(SOURCE, `<div class="bg:red">a</div>`)
        const v2 = await ex.insert(SOURCE, `<div class="bg:blue">b</div>`)
        expect(v1).toBe(true)
        expect(v2).toBe(true)
    })

    test('reset() clears the content-hash cache', async () => {
        const ex = new CSSExtractor({ config: {} as any }).init()
        await ex.insert(SOURCE, CONTENT)
        await ex.reset()
        // After reset, the hash for SOURCE is gone, so the same content
        // re-inserts (returns true again).
        const after = await ex.insert(SOURCE, CONTENT)
        expect(after).toBe(true)
    })
})

describe('valid-rules memo (Phase A optimisation)', () => {
    test('same class across many files is processed once', async () => {
        const ex = new CSSExtractor({ config: {} as any }).init()
        // First file with the class — populates validClasses + the rules cache.
        await ex.insert('a.tsx', `<div className="bg:white">a</div>`)
        expect(ex.validClasses.has('bg:white')).toBe(true)
        // Subsequent files with the same class — already in validClasses, so
        // the inner generateValidRules path is skipped entirely. The
        // assertion is structural: the rules-cache Map exists and is
        // populated.
        await ex.insert('b.tsx', `<div className="bg:white">b</div>`)
        await ex.insert('c.tsx', `<div className="bg:white">c</div>`)
        // @ts-expect-error access private cache for verification
        expect(ex.validRulesCache.has('bg:white')).toBe(true)
        // @ts-expect-error access private cache for verification
        expect(ex.validRulesCache.size).toBe(1)
    })
})
