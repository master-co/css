import { expect, test } from 'vitest'
import {
    applyMasterCSSDirectiveFormatEdits,
    formatMasterCSSClassList,
    formatMasterCSSDirectives
} from '../src'

function format(source: string) {
    return applyMasterCSSDirectiveFormatEdits(source, formatMasterCSSDirectives(source))
}

test.concurrent('repairs detached important suffixes in class lists', () => {
    expect(formatMasterCSSClassList(' bg:transparent !   fg:red !@sm  block!:hover ')).toBe('bg:transparent! fg:red!@sm block!:hover')
})

test.concurrent('formats @compose class-list preludes', () => {
    expect(format('.btn { @compose  bg:transparent !   fg:red !@sm ; }'))
        .toBe('.btn { @compose bg:transparent! fg:red!@sm; }')
})

test.concurrent('leaves quoted and grouped @compose syntax unchanged', () => {
    expect(format('.btn { @compose "bg:transparent !"; }')).toBe('.btn { @compose "bg:transparent !"; }')
    expect(format('.btn { @compose { bg:transparent ! }; }')).toBe('.btn { @compose { bg:transparent ! }; }')
})

test.concurrent('formats @safelist quoted class lists while preserving quote style', () => {
    expect(format('@safelist  \'bg:transparent !   fg:red !@sm\' ;\n@safelist "block  bg:blue !";'))
        .toBe('@safelist \'bg:transparent! fg:red!@sm\';\n@safelist "block bg:blue!";')
})

test.concurrent('leaves internal styles dogfood directives unchanged', () => {
    const source = [
        '@components {',
        '    monaco-editor {',
        '        @compose --vscode-editor-background:transparent! bg:blue filter:drop-shadow(0|2px|2px|rgba(0,0,0,.2px));',
        '    }',
        '}'
    ].join('\n')

    expect(format(source)).toBe(source)
})

test.concurrent('normalizes directive spacing without changing block contents', () => {
    expect(format('@theme  dark{ .x { color: red; } @slot ; }'))
        .toBe('@theme dark { .x { color: red; } @slot; }')
})

test.concurrent('ignores directives inside comments and strings', () => {
    expect(format('/* @compose bg:red !; */\n.x::before { content: "@compose bg:red !;"; @compose bg:blue !; }'))
        .toBe('/* @compose bg:red !; */\n.x::before { content: "@compose bg:red !;"; @compose bg:blue!; }')
})

test.concurrent('can limit edits to a source range', () => {
    const source = '.a { @compose bg:red !; }\n.b { @compose bg:blue !; }'
    const start = source.indexOf('@compose bg:blue')
    const result = applyMasterCSSDirectiveFormatEdits(source, formatMasterCSSDirectives(source, {
        range: {
            start,
            end: source.length
        }
    }))
    expect(result).toBe('.a { @compose bg:red !; }\n.b { @compose bg:blue!; }')
})
