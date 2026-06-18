import { expect, test } from 'vitest'

import {
    collectCSSDeclarationRanges,
    collectCSSDirectiveRanges,
    findCSSStatementEnd
} from '../src'

test.concurrent('collects directive statement and block ranges', () => {
    const source = [
        '@source "a;b.css";',
        '@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } }'
    ].join('\n')
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['source', 'theme'])
    expect(source.slice(ranges[0].semicolonRange?.start, ranges[0].semicolonRange?.end)).toBe(';')
    expect(source.slice(ranges[0].quotedStringRanges[0].contentRange.start, ranges[0].quotedStringRanges[0].contentRange.end)).toBe('a;b.css')
    expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('')
    expect(ranges[1].blockRange).toBeDefined()
    expect(ranges[1].blockCloseRange).toBeDefined()
    expect(source.slice(ranges[1].blockRange!.start, ranges[1].blockRange!.start + 1)).toBe('{')
    expect(source.slice(ranges[1].blockCloseRange!.start, ranges[1].blockCloseRange!.end)).toBe('}')
})

test.concurrent('collects reference directive ranges', () => {
    const source = [
        '@reference "./a;b.css";',
        '@layer components { .btn { @reference "./nested.css"; } }'
    ].join('\n')
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['reference', 'reference'])
    expect(ranges[0].depth).toBe(0)
    expect(ranges[1].depth).toBe(2)
    expect(source.slice(ranges[0].semicolonRange?.start, ranges[0].semicolonRange?.end)).toBe(';')
    expect(source.slice(ranges[0].quotedStringRanges[0].contentRange.start, ranges[0].quotedStringRanges[0].contentRange.end)).toBe('./a;b.css')
})

test.concurrent('collects nested Master directive ranges without treating host at-rules as directives', () => {
    const source = '@layer components { .btn { @compose block; @variant @<sm { @compose hidden; } } }'
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['compose', 'variant', 'compose'])
    expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('@<sm')
    expect(source.slice(ranges[2].preludeRange.start, ranges[2].preludeRange.end).trim()).toBe('hidden')
})

test.concurrent('collects dark and light shorthand ranges as variant directives', () => {
    const source = '.card { @dark { @compose fg:white; } @light { color: black; } }'
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['variant', 'compose', 'variant'])
    expect(source.slice(ranges[0].keywordRange.start, ranges[0].keywordRange.end)).toBe('@dark')
    expect(source.slice(ranges[0].preludeRange.start, ranges[0].preludeRange.end).trim()).toBe('')
    expect(source.slice(ranges[2].keywordRange.start, ranges[2].keywordRange.end)).toBe('@light')
})

test.concurrent('collects slot directive ranges inside custom variants', () => {
    const source = '@custom-variant @motion-safe { @media (prefers-reduced-motion: no-preference) { @slot; } }'
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['custom-variant', 'slot'])
    expect(source.slice(ranges[1].keywordRange.start, ranges[1].keywordRange.end)).toBe('@slot')
    expect(source.slice(ranges[1].semicolonRange!.start, ranges[1].semicolonRange!.end)).toBe(';')
})

test.concurrent('collects managed definition directive ranges', () => {
    const source = '@components { btn { @compose block; } }'
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['components', 'compose'])
    expect(source.slice(ranges[0].blockRange!.start, ranges[0].blockRange!.start + 1)).toBe('{')
    expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('block')
})

test.concurrent('does not collect @utility as a Master CSS directive', () => {
    const source = '@utility text-<left|center|right> { text-align: --value(); }'
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges).toEqual([])
})

test.concurrent('collects declaration ranges without splitting quoted semicolons', () => {
    const source = '@theme { --content: "a;b"; --root-size: 16 }'
    const blockStart = source.indexOf('{') + 1
    const blockEnd = source.lastIndexOf('}')
    const declarations = collectCSSDeclarationRanges(source, blockStart, blockEnd)

    expect(declarations.map((declaration) => source.slice(declaration.propertyRange.start, declaration.propertyRange.end))).toEqual([
        '--content',
        '--root-size'
    ])
    expect(source.slice(declarations[0].valueRange.start, declarations[0].valueRange.end)).toBe('"a;b"')
    expect(declarations[0].terminatorRange).toEqual({
        start: source.indexOf('; --root-size'),
        end: source.indexOf('; --root-size') + 1
    })
})

test.concurrent('collects only top-level declaration ranges', () => {
    const source = '@theme { --color-primary: red; @keyframes fade { to { opacity: 1; } } --duration-fast: 150ms }'
    const blockStart = source.indexOf('{') + 1
    const blockEnd = source.lastIndexOf('}')
    const declarations = collectCSSDeclarationRanges(source, blockStart, blockEnd)

    expect(declarations.map((declaration) => source.slice(declaration.propertyRange.start, declaration.propertyRange.end))).toEqual([
        '--color-primary',
        '--duration-fast'
    ])
})

test.concurrent('returns eof for incomplete directive statements', () => {
    const source = '@theme dark'
    expect(findCSSStatementEnd(source, '@theme'.length)).toEqual({
        end: source.length,
        reason: 'eof'
    })
})
