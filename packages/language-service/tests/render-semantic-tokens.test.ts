import { expect, test } from 'vitest'

import CSSLanguageService from './helpers/rc87-language-service'
import createDoc from '../src/utils/create-doc'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '@master/css-tooling/language'
import { createPresetManifest } from './helpers/create-preset-manifest'

function decodeSemanticTokenRanges(doc: ReturnType<typeof createDoc>, data: number[]) {
  const tokens: { text: string, start: number, end: number, type: string, modifiers: string[] }[] = []
  let line = 0
  let character = 0
  for (let i = 0; i < data.length; i += 5) {
    const deltaLine = data[i]
    const deltaStart = data[i + 1]
    line += deltaLine
    character = deltaLine === 0 ? character + deltaStart : deltaStart
    const length = data[i + 2]
    const type = SEMANTIC_TOKEN_TYPES[data[i + 3]]
    const modifierBits = data[i + 4]
    const start = doc.offsetAt({ line, character })
    const end = doc.offsetAt({ line, character: character + length })
    tokens.push({
      text: doc.getText().slice(start, end),
      start,
      end,
      type,
      modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index))
    })
  }
  return tokens
}

function decodeSemanticTokens(doc: ReturnType<typeof createDoc>, data: number[]) {
  return decodeSemanticTokenRanges(doc, data).map(({ text, type, modifiers }) => ({ text, type, modifiers }))
}

function renderTokens(content: string, ext: Parameters<typeof createDoc>[0] = 'tsx', settings?: ConstructorParameters<typeof CSSLanguageService>[0]) {
  const doc = createDoc(ext, content)
  const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'always', ...settings })
  const semanticTokens = languageService.renderSemanticTokens(doc)
  return {
    doc,
    tokens: decodeSemanticTokens(doc, semanticTokens?.data ?? [])
  }
}

function expectToken(tokens: { text: string, type: string, modifiers: string[] }[], text: string, type: string, modifiers: string[] = []) {
  expect(tokens).toContainEqual({ text, type, modifiers })
}

test.concurrent('renders semantic tokens for class attributes', () => {
  const { tokens } = renderTokens(
    "<div className=\"fg-brand:hover@sm sr-only sr-only:hover sr-only:is(:state-name) sr-only_div::before:is(.active) margin:1rem background-color:rgb(0|0|0) width:0.625rem::scrollbar btn btn:hover@sm btn_div::before\"></div>",
    'tsx',
    {
      manifest: createPresetManifest({
        variables: [{ namespace: 'color', key: 'brand', values: [{ path: [':root,:host'], value: '#123456' }] }],
        mixins: [
  {
    "name": "--btn",
    "body": [
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "color",
            "value": [
              {
                "type": "text" as const,
                "value": "var(--color-brand)"
              }
            ]
          }
        ]
      },
      {
        "type": "rule" as const,
        "selector": "&",
        "body": [
          {
            "type": "declaration" as const,
            "property": "display",
            "value": [
              {
                "type": "text" as const,
                "value": "block"
              }
            ]
          }
        ]
      }
    ]
  }
]
      })
    }
  )

  expectToken(tokens, 'fg-brand', 'enumMember')
  expectToken(tokens, ':', 'operator', ['pseudoClass', 'selector', 'pseudoClassDelimiter'])
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, '@sm', 'keyword', ['query'])
  expectToken(tokens, "sr-only", 'enumMember')
  expectToken(tokens, 'state-name', 'modifier', ['pseudoClass'])
  expectToken(tokens, "sr-only", 'enumMember')
  expectToken(tokens, '_', 'operator', ['selector', 'selectorCombinator'])
  expectToken(tokens, 'div', 'type', ['selector'])
  expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector', 'pseudoElementDelimiter'])
  expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
  expectToken(tokens, 'is', 'modifier', ['pseudoClass'])
  expectToken(tokens, '.', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'active', 'class', ['selector'])
  expectToken(tokens, '1', 'number')
  expectToken(tokens, 'rem', 'enumMember', ['unit'])
  expectToken(tokens, 'rgb', 'function')
  expectToken(tokens, 'scrollbar', 'modifier', ['pseudoElement'])
  expectToken(tokens, 'btn', 'enumMember', [])
  expect(tokens.filter(({ text, type, modifiers }) => text === 'btn' && type === 'enumMember' && modifiers.length === 0)).toHaveLength(3)
})

test.concurrent('renders semantic tokens for CSS-like values', () => {
  const { tokens } = renderTokens(
    "<div className=\"height:var(--size-sm) color:color-mix(in|oklab,var(--color-blue-50)|50%,transparent) content:x::before background-color:rgb(0|0|0) fg-red_:where(a:hover) font-mono_:is(code,pre)@layer(base) font-semibold_:headings font-semibold_:is(h1,h2,h3,h4,h5,h6)\"></div>",
    'tsx',
    {
      manifest: createPresetManifest({
        variables: [
          { key: 'size-sm', values: [{ path: [':root,:host'], value: '16px' }] },
          { namespace: 'color', key: 'blue-50', values: [{ path: [':root,:host'], value: 'oklch(60% 0.2 250)' }] }
        ]
      })
    }
  )

  expectToken(tokens, '--size-sm', 'variable')
  expectToken(tokens, '--color-blue-50', 'variable')
  expectToken(tokens, ',', 'operator', ['valueSeparator'])
  expectToken(tokens, '50', 'number')
  expectToken(tokens, 'x', 'enumMember')
  expectToken(tokens, '::', 'operator', ['pseudoElement', 'selector', 'pseudoElementDelimiter'])
  expectToken(tokens, 'before', 'modifier', ['pseudoElement'])
  expectToken(tokens, 'rgb', 'function')
  expectToken(tokens, '|', 'operator', ['valueSeparator'])
  expectToken(tokens, '_', 'operator', ['selector', 'selectorCombinator'])
  expectToken(tokens, 'where', 'modifier', ['pseudoClass'])
  expectToken(tokens, '(', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'a', 'type', ['selector'])
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, ')', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'is', 'modifier', ['pseudoClass'])
  expectToken(tokens, 'code', 'type', ['selector'])
  expectToken(tokens, ',', 'operator', ['selector', 'selectorPunctuation'])
  expectToken(tokens, 'pre', 'type', ['selector'])
  expectToken(tokens, 'headings', 'modifier', ['pseudoClass'])
  expectToken(tokens, 'h1', 'type', ['selector'])
  expectToken(tokens, 'h2', 'type', ['selector'])
  expectToken(tokens, 'h3', 'type', ['selector'])
  expectToken(tokens, 'h4', 'type', ['selector'])
  expectToken(tokens, 'h5', 'type', ['selector'])
  expectToken(tokens, 'h6', 'type', ['selector'])
  expectToken(tokens, '@layer', 'keyword', ['query'])
})

test.concurrent('renders semantic tokens for vendor-prefixed native declarations', () => {
  const { tokens } = renderTokens(
    '<div className="-webkit-text-size-adjust:none -moz-text-size-adjust:none -ms-text-size-adjust:none"></div>',
    'tsx'
  )

  expectToken(tokens, '-webkit-text-size-adjust', 'property')
  expectToken(tokens, '-moz-text-size-adjust', 'property')
  expectToken(tokens, '-ms-text-size-adjust', 'property')
  expectToken(tokens, ':', 'operator', ['declarationSeparator'])
  expect(tokens.filter(({ text, type }) => text === 'none' && type === 'enumMember')).toHaveLength(3)
})

test.concurrent('renders semantic tokens for container queries and slash-separated string values', () => {
  const { tokens } = renderTokens(
    "<div className=\"sr-only@container(sm&<=md) container:card/inline-size grid-cols(2)@card(3xs) background-position:center background-size:cover background-image:url(/hero.jpg) sr-only@media(pointer:coarse) sr-only@h>=sm&h<lg\"></div>",
    'html'
  )

  expectToken(tokens, "sr-only", 'enumMember')
  expectToken(tokens, '@container', 'keyword', ['query'])
  expectToken(tokens, '(', 'operator', ['query', 'queryPunctuation'])
  expectToken(tokens, 'sm', 'enumMember', ['query'])
  expectToken(tokens, '&', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, '<=', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, 'md', 'enumMember', ['query'])
  expectToken(tokens, ')', 'operator', ['query', 'queryPunctuation'])
  expectToken(tokens, 'container', 'property')
  expectToken(tokens, 'card', 'enumMember')
  expectToken(tokens, '/', 'operator', ['valueSeparator'])
  expectToken(tokens, 'inline-size', 'enumMember')
  expectToken(tokens, 'grid-cols', 'function')
  expectToken(tokens, '2', 'number')
  expectToken(tokens, '@card', 'keyword', ['query'])
  expectToken(tokens, '3', 'number', ['query'])
  expectToken(tokens, 'xs', 'enumMember', ['query', 'unit'])
  expectToken(tokens, 'sr-only', 'enumMember')
  expectToken(tokens, 'cover', 'enumMember')
  expectToken(tokens, 'background-image', 'property')
  expectToken(tokens, 'url', 'function')
  expectToken(tokens, '/hero.jpg', 'string')
  expectToken(tokens, '@media', 'keyword', ['query'])
  expectToken(tokens, 'pointer', 'property', ['query'])
  expectToken(tokens, ':', 'operator', ['query', 'queryPunctuation'])
  expectToken(tokens, 'coarse', 'enumMember', ['query'])
  expectToken(tokens, '@h', 'keyword', ['query'])
  expectToken(tokens, '>=', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, 'sm', 'enumMember', ['query'])
  expectToken(tokens, 'h', 'property', ['query'])
  expectToken(tokens, '<', 'operator', ['query', 'queryOperator'])
  expectToken(tokens, 'lg', 'enumMember', ['query'])
  expect(tokens.filter(({ text, type, modifiers }) => text === '/' && type === 'operator' && modifiers.includes('valueSeparator'))).toHaveLength(1)
})

test.concurrent('renders semantic tokens for internal styles dogfood directives', () => {
  const { tokens } = renderTokens("@mixin --monaco-editor {\n        @safelist \"--vscode-editor-background:transparent! bg-blue filter:drop-shadow(0|2px|2px|rgba(0,0,0,.2px))\";\n    }", 'css')

  expectToken(tokens, '--vscode-editor-background', 'property')
  expectToken(tokens, 'transparent', 'enumMember')
  expectToken(tokens, '!', 'operator', ['important'])
  expectToken(tokens, 'bg-blue', 'enumMember')
  expectToken(tokens, 'filter', 'property')
  expectToken(tokens, 'drop-shadow', 'function')
  expectToken(tokens, 'rgba', 'function')
  expectToken(tokens, '.2', 'number')
  expectToken(tokens, 'px', 'enumMember', ['unit'])
})

test.concurrent('renders semantic tokens for independent declarations, strings, units, and important marks', () => {
  const { tokens } = renderTokens(
    '<div class="fg-red bg-blue transform:translate(2.5rem|20px) content:\'a|b\' size:2.5rem fg-red!"></div>',
    'html'
  )

  expectToken(tokens, ':', 'operator', ['declarationSeparator'])
  expectToken(tokens, 'fg-red', 'enumMember')
  expectToken(tokens, 'bg-blue', 'enumMember')
  expectToken(tokens, 'transform', 'property')
  expectToken(tokens, 'translate', 'function')
  expectToken(tokens, '(', 'operator', ['functionPunctuation'])
  expectToken(tokens, '2.5', 'number')
  expectToken(tokens, 'rem', 'enumMember', ['unit'])
  // Master CSS uses `|` as a compact separator in places where native CSS
  // often uses whitespace or commas, so it keeps a distinct value role.
  expectToken(tokens, '|', 'operator', ['valueSeparator'])
  expectToken(tokens, '20', 'number')
  expectToken(tokens, 'px', 'enumMember', ['unit'])
  expectToken(tokens, ')', 'operator', ['functionPunctuation'])
  expectToken(tokens, '\'', 'string', ['quoted'])
  expectToken(tokens, 'a|b', 'string', ['quoted'])
  expectToken(tokens, 'rem', 'enumMember', ['unit'])
  expectToken(tokens, '!', 'operator', ['important'])
})

test.concurrent('renders native-aligned semantic tokens for independent classes with selector suffixes', () => {
  const { tokens } = renderTokens(
    "<div class=\"text-align:center>li:hover@sm sr-only>li:hover@sm\"></div>",
    'html'
  )

  expectToken(tokens, 'text-align', 'property')
  expectToken(tokens, ':', 'operator', ['declarationSeparator'])
  expectToken(tokens, 'sr-only', 'enumMember')
  expectToken(tokens, "sr-only", 'enumMember')
  expectToken(tokens, '>', 'operator', ['selector', 'selectorCombinator'])
  expectToken(tokens, 'li', 'type', ['selector'])
  expectToken(tokens, ':', 'operator', ['pseudoClass', 'selector', 'pseudoClassDelimiter'])
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, '@sm', 'keyword', ['query'])
  expect(tokens.some(({ text }) => text.includes("sr-only}>li:hover@sm"))).toBe(false)
})

test.concurrent('renders semantic tokens only for CSS directive class-list spans', () => {
  const { tokens } = renderTokens("\n    @import \"@master/css\";\n    @reference \"./tokens.css\";\n    @safelist \"sr-only fg-red:hover@md\";\n\n    @settings {\n      root-size: 16;\n    }\n\n    @theme { .dark {\n      --color-primary: --alpha(var(--color-blue-60) / 80%);\n    } }\n\n\n    @theme {\n      \n    }\n@keyframes fade {\n        to {\n          opacity: 1;\n        }\n      }\n\n\n    @mixin --motion-safe { @media (prefers-reduced-motion: no-preference) { @contents; } }\n\n    @mixin --reset {\n        @safelist \"sr-only\";\n      }\n\n    @mixin --btn {\n        @safelist \"text-gradient fg-primary:hover@md\";\n        @media (prefers-color-scheme: dark) {\n          @safelist \"bg-blue\";\n        }\n        @variant <sm {\n          @safelist \"sr-only\";\n        }\n        ::scrollbar-thumb:hover {\n          @media (prefers-color-scheme: dark) {\n            @safelist \"fg-primary\";\n          }\n        }\n      }\n\n    @mixin --content-auto {\n        @safelist \"sr-only\";\n      }\n@mixin --text-left {\n        text-align: left;\n      }\n@mixin --text-center {\n        text-align: center;\n      }\n@mixin --text-right {\n        text-align: right;\n      }\n@layer(utilities) font-* from(--font-size-*) {\n        font-size: var(--value);\n      }\n@layer(utilities) bg-* from(--color-*) {\n        background-color: var(--value);\n      }\n@layer(utilities) text-decoration-* from(--color-*) {\n        text-decoration: var(--value);\n      }\n@mixin --user-select(--value) {\n        user-select: var(--value);\n      }\n@mixin --grid-cols(--value) {\n        grid-template-columns: repeat(var(--value), minmax(0, 1fr));\n\n        @variant <sm {\n          font-size: var(--value);\n        }\n\n        &:hover {\n          text-align: var(--value);\n        }\n      }\n  ", 'css', { manifest: createPresetManifest({ variables: [{ namespace: 'color', key: 'primary', values: [{ path: [':root,:host'], value: '#4f46e5' }] }] }) })

  expectToken(tokens, "sr-only", 'enumMember')
  expectToken(tokens, 'fg-red', 'enumMember')
  expectToken(tokens, 'fg-primary', 'enumMember')
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, '@md', 'keyword', ['query'])
  expectToken(tokens, "text-gradient", 'enumMember')
  expectToken(tokens, 'bg-blue', 'enumMember')

  expect(tokens).not.toContainEqual({ text: '@master', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@reference', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@settings', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'root-size', type: 'property' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '@theme', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'dark', type: 'enumMember' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--color-primary', type: 'variable' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '--color-blue-60', type: 'variable' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '@custom-variant', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@apply(--motion-safe)', type: 'keyword' as const, modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: '@contents', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'reset', type: 'class' as const, modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'btn', type: 'class' as const, modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '<', type: 'operator' as const, modifiers: ['query', 'queryOperator'] })
  expect(tokens).not.toContainEqual({ text: 'sm', type: 'enumMember' as const, modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'text-', type: 'class' as const, modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '--value', type: 'function' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'text-align', type: 'property' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'repeat', type: 'function' as const, modifiers: [] })
})

test.concurrent('does not render semantic tokens for theme directive declarations', () => {
  const { tokens } = renderTokens("\n    @theme { :root, :host {\n      --font-family-serif: var(--font-serif, ui-serif), Georgia, Cambria, \"Times New Roman\", Times, serif;\n      --tracking-tightest: -0.072em;\n\n      \n\n      --color-stone-0: oklch(99% 0.0033 72);\n    } }\n@keyframes zoom {\n        0% {\n          transform: scale(0);\n          color: var(--color-red-50);\n        }\n\n        to {\n          transform: --value();\n        }\n      }\n\n\n    @theme { .dark {\n      --color-surface-base: var(--color-gray-100);\n    } }\n\n\n    @theme { :root, :host {\n      --full: 100%;\n    } }\n\n  ", 'css')

  expect(tokens).toEqual([])
})

test.concurrent('renders semantic tokens only for compose class lists inside managed definition directives', () => {
  const { tokens } = renderTokens("\n    @mixin --reset {\n        @media (prefers-color-scheme: light) {\n          color: var(--text, black);\n        }\n      }\n\n    @mixin --btn {\n        @safelist \"text-gradient\";\n        @media (prefers-color-scheme: dark) {\n          background-color: oklch(20% 0.03 250);\n        }\n        @media (width >= 42rem) {\n          .label:hover {\n            transform: scale(1);\n          }\n        }\n      }\n@layer(utilities) btn:hover {\n        @safelist \"sr-only\";\n      }\n\n    @mixin --font(--value) {\n        font-size: var(--value);\n        &:hover {\n          text-align: var(--align, center);\n        }\n      }\n@mixin --text-left {\n        text-align: left;\n      }\n@mixin --text-right {\n        text-align: right;\n      }\n  ", 'css')

  expectToken(tokens, "text-gradient", 'enumMember')
  expectToken(tokens, "sr-only", 'enumMember')
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'reset', type: 'class' as const, modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@light', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'btn', type: 'class' as const, modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@dark', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'font', type: 'property' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'font-size', type: 'variable' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--value', type: 'function' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'text-', type: 'class' as const, modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@media', type: 'keyword' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'label', type: 'class' as const, modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: 'hover', type: 'modifier' as const, modifiers: ['pseudoClass'] })
  expect(tokens).not.toContainEqual({ text: 'font-size', type: 'property' as const, modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'var', type: 'function' as const, modifiers: [] })
})

test.concurrent('renders CSS directive ranges with quoted semicolons', () => {
  const { tokens } = renderTokens("\n    @source not \"a;b.css\";\n    @source \"critical.tsx\";\n    @reference \"./a;b.css\";\n    @safelist \"sr-only fg-red\";\n    @blocklist \"debug-*\";\n    @preserve native;\n\n    .btn {\n      @safelist \"fg-red\";\n    }\n\n    @mixin --quoted { @media (x: \"a;b\") { @contents; } }\n  ", 'css')

  expectToken(tokens, "sr-only", 'enumMember')
  expectToken(tokens, 'fg-red', 'enumMember')
  expect(tokens).not.toContainEqual({ text: '@source', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'not', type: 'modifier' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: ';', type: 'operator' as const, modifiers: ['directive', 'directiveTerminator'] })
  expect(tokens).not.toContainEqual({ text: '@safelist', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@blocklist', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@preserve', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'native', type: 'enumMember' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@custom-variant', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@apply(--quoted)', type: 'keyword' as const, modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: '@contents', type: 'keyword' as const, modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'debug-*', type: 'string' as const, modifiers: ['quoted'] })
})

test.concurrent('does not tokenize quoted compose preludes as class lists', () => {
  const { tokens } = renderTokens(".btn { @compose \"sr-only fg-red\"; }", 'css')

  expect(tokens).toEqual([])
})

test.concurrent('does not render semantic tokens for custom variant directive syntax', () => {
  const { tokens } = renderTokens(`
    @mixin --supports-backdrop {
      @supports (backdrop-filter: blur(0)) {
        @contents;
      }
    }
    @mixin --card-wide {
      @container card (width >= 42rem) {
        @contents;
      }
    }
    @mixin --component {
      @layer utilities {
        @contents;
      }
    }
    @mixin --starting-style {
      @starting-style {
        @contents;
      }
    }
    @mixin --scrollbars {
      @media all {
        @contents;
      }
    }
  `, 'css')

  expect(tokens).toEqual([])
})

test.concurrent('does not render inline theme modifier semantic tokens', () => {
  const { tokens } = renderTokens("@theme { :root, :host { --color-primary: #123; } }\n", 'css')

  expect(tokens).toEqual([])
})


test.concurrent('does not render non-entry @master at-rules as CSS directives', () => {
  const { tokens } = renderTokens(`
    @master shake;
    @master no-shake;
  `, 'css')

  expect(tokens).not.toContainEqual({ text: '@master', type: 'keyword' as const, modifiers: ['directive'] })
})

