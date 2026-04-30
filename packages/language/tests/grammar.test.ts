import { describe, test, expect, beforeAll } from 'vitest'
import { loadGrammar, tokenize, findToken, hasMcssScope, hasCommentScope } from './setup'
import type { IGrammar } from 'vscode-textmate'

describe('master-css grammar — TSX host', () => {
    let grammar: IGrammar

    beforeAll(async () => {
        ({ grammar } = await loadGrammar('tsx'))
    })

    test('live className gets master-css fingerprint scopes', () => {
        const tokens = tokenize(grammar, `<div className="bg:white fg:black">x</div>`)
        const bg = findToken(tokens, 'bg')
        if (!bg) throw new Error('bg token not found')
        expect(hasMcssScope(bg.scopes)).toBe(true)
        expect(hasCommentScope(bg.scopes)).toBe(false)
    })

    test('issue #361: line-commented JSX className does NOT get master-css scopes', () => {
        const tokens = tokenize(grammar, `// const a = <div className="bg:white">x</div>`)
        const bg = findToken(tokens, 'bg')
        if (!bg) throw new Error('bg token not found')
        expect(hasMcssScope(bg.scopes)).toBe(false)
        expect(hasCommentScope(bg.scopes)).toBe(true)
    })

    test('issue #361: block-commented JSX className does NOT get master-css scopes', () => {
        const tokens = tokenize(grammar, `/* const a = <div className="bg:white">x</div> */`)
        const bg = findToken(tokens, 'bg')
        if (!bg) throw new Error('bg token not found')
        expect(hasMcssScope(bg.scopes)).toBe(false)
        expect(hasCommentScope(bg.scopes)).toBe(true)
    })

    test('issue #217: `|` separator in className uses punctuation.separator.master-css, not comment.block', () => {
        const tokens = tokenize(grammar, `<div className="bg:white|red">x</div>`)
        const pipe = tokens.find(t => t.text === '|')
        if (!pipe) throw new Error('pipe token not found')
        // The pipe must NOT be in comment.block (the pre-fix scope) ...
        expect(pipe.scopes).not.toContain('comment.block')
        // ... and must carry the new dedicated punctuation scope.
        expect(pipe.scopes).toContain('punctuation.separator.master-css')
    })

    test('issue #217: `.png` inside bg:url(/foo.png) is NOT treated as a CSS class selector', () => {
        const tokens = tokenize(grammar, `<div className="bg:url(/foo.png)|cover">x</div>`)
        // Look for any token whose text contains `.png` — it must not carry
        // the class-selector scope (the pre-fix bug).
        const pngTokens = tokens.filter(t => t.text.includes('png') || t.text.includes('.png'))
        for (const tok of pngTokens) {
            expect(tok.scopes).not.toContain('entity.other.attribute-name.class.css')
        }
    })

    test('regression: `.btn` after a space is still tokenized as a class selector', () => {
        const tokens = tokenize(grammar, `<div className="bg:white .btn">x</div>`)
        const dot = tokens.find(t => t.text === '.')
        const btn = tokens.find(t => t.text === 'btn')
        // Either the `.` and `btn` are separate tokens, both carrying the
        // class-selector scope, or they're merged into `.btn` carrying it.
        const merged = tokens.find(t => t.text === '.btn')
        const carriers = [dot, btn, merged].filter(Boolean) as { scopes: string[] }[]
        expect(carriers.length).toBeGreaterThan(0)
        expect(carriers.some(t => t.scopes.includes('entity.other.attribute-name.class.css'))).toBe(true)
    })
})

describe('master-css grammar — HTML host', () => {
    let grammar: IGrammar

    beforeAll(async () => {
        ({ grammar } = await loadGrammar('html'))
    })

    test('live class attribute gets master-css fingerprint scopes', () => {
        const tokens = tokenize(grammar, `<div class="bg:white fg:black">x</div>`)
        const bg = findToken(tokens, 'bg')
        if (!bg) throw new Error('bg token not found')
        expect(hasMcssScope(bg.scopes)).toBe(true)
    })

    test('issue #361: HTML-commented class does NOT get master-css scopes', () => {
        const tokens = tokenize(grammar, `<!-- <div class="bg:white">x</div> -->`)
        const bg = findToken(tokens, 'bg')
        if (!bg) throw new Error('bg token not found')
        expect(hasMcssScope(bg.scopes)).toBe(false)
        expect(hasCommentScope(bg.scopes)).toBe(true)
    })
})
