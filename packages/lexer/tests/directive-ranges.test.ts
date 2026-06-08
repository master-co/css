import { expect, test } from 'vitest'

import {
    collectCSSDeclarationRanges,
    collectCSSDirectiveRanges,
    findCSSStatementEnd
} from '../src'

test.concurrent('collects directive statement and block ranges', () => {
    const source = [
        '@source "a;b.css";',
        '@theme dark { --color-primary: red; }'
    ].join('\n')
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['source', 'theme'])
    expect(source.slice(ranges[0].semicolonRange?.start, ranges[0].semicolonRange?.end)).toBe(';')
    expect(source.slice(ranges[0].quotedStringRanges[0].contentRange.start, ranges[0].quotedStringRanges[0].contentRange.end)).toBe('a;b.css')
    expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('dark')
    expect(ranges[1].blockRange).toBeDefined()
    expect(ranges[1].blockCloseRange).toBeDefined()
    expect(source.slice(ranges[1].blockRange!.start, ranges[1].blockRange!.start + 1)).toBe('{')
    expect(source.slice(ranges[1].blockCloseRange!.start, ranges[1].blockCloseRange!.end)).toBe('}')
})

test.concurrent('collects nested Master directive ranges without treating host at-rules as directives', () => {
    const source = '@layer components { .btn { @compose "block"; @at <sm { @compose "hidden"; } } }'
    const ranges = collectCSSDirectiveRanges(source)

    expect(ranges.map((range) => range.name)).toEqual(['compose', 'at', 'compose'])
    expect(source.slice(ranges[1].preludeRange.start, ranges[1].preludeRange.end).trim()).toBe('<sm')
    expect(source.slice(ranges[2].quotedStringRanges[0].contentRange.start, ranges[2].quotedStringRanges[0].contentRange.end)).toBe('hidden')
})

test.concurrent('collects declaration ranges without splitting quoted semicolons', () => {
    const source = '@theme { --content: "a;b"; root-size: 16 }'
    const blockStart = source.indexOf('{') + 1
    const blockEnd = source.lastIndexOf('}')
    const declarations = collectCSSDeclarationRanges(source, blockStart, blockEnd)

    expect(declarations.map((declaration) => source.slice(declaration.propertyRange.start, declaration.propertyRange.end))).toEqual([
        '--content',
        'root-size'
    ])
    expect(source.slice(declarations[0].valueRange.start, declarations[0].valueRange.end)).toBe('"a;b"')
    expect(declarations[0].terminatorRange).toEqual({
        start: source.indexOf('; root-size'),
        end: source.indexOf('; root-size') + 1
    })
})

test.concurrent('returns eof for incomplete directive statements', () => {
    const source = '@theme dark'
    expect(findCSSStatementEnd(source, '@theme'.length)).toEqual({
        end: source.length,
        reason: 'eof'
    })
})
