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

test.concurrent('does not render semantic tokens for native CSS-only documents', () => {
  const { tokens } = renderTokens("\n    @charset \"utf-8\";\n    @import url(\"base.css\") layer(theme) supports(display: grid);\n    @namespace svg url(\"http://www.w3.org/2000/svg\");\n    /* @theme { .should remain a native comment */\n\n    @font-face {\n      font-family: \"Inter\";\n      src: url(\"/fonts/inter.woff2\") format(\"woff2\");\n      font-display: swap;\n    } }\n\n\n    @property --angle {\n      syntax: \"<angle>\";\n      inherits: false;\n      initial-value: 0deg;\n    }\n\n    @counter-style bullets {\n      system: cyclic;\n      symbols: \"*\" \"\\2022\";\n      suffix: \" \";\n    }\n\n    @font-feature-values Inter {\n      @styleset {\n        nice: 1;\n      }\n    }\n\n    @font-palette-values --brand {\n      font-family: \"Bixa\";\n      base-palette: 1;\n      override-colors: 0 #0f172a;\n    }\n\n    @page :first {\n      margin: 1cm;\n      @top-left {\n        content: \"Chapter\";\n      }\n    }\n\n    @position-try --bottom {\n      inset-area: bottom;\n      margin: 1rem;\n    }\n\n    @view-transition {\n      navigation: auto;\n    }\n\n    @scope (.card) to (.content) {\n      :scope {\n        color: red;\n      }\n    }\n\n    @starting-style {\n      .card {\n        opacity: 0;\n      }\n    }\n\n    @document url(\"https://example.com/\") {\n      body {\n        color: red;\n      }\n    }\n\n    @keyframes fade {\n      from {\n        opacity: 0;\n        transform: translateX(0);\n      }\n\n      to {\n        opacity: 1;\n        transform: translateX(var(--distance));\n      }\n    }\n\n    @layer reset, theme, components;\n\n    @media (width >= 48rem) {\n      .card:hover::before {\n        --distance: calc(100% - 1rem);\n        color: red;\n        content: \"@utilities\";\n      }\n    }\n\n    @supports (container-type: inline-size) {\n      @container card (width > 30rem) {\n        @layer utilities {\n          .card:is(.active, #featured) {\n            animation: fade 1s ease-in-out;\n          }\n        }\n      }\n    }\n  ", 'css')

  expect(tokens).toEqual([])
})

test.concurrent('renders CSS document semantic tokens only inside directive class-list ranges', () => {
  const nativeBefore = [
    '@font-face {',
    '    font-family: "Inter";',
    '    src: url("/fonts/inter.woff2") format("woff2");',
    '}',
    '@property --angle {',
    '    syntax: "<angle>";',
    '    inherits: false;',
    '    initial-value: 0deg;',
    '}',
    '@keyframes fade {',
    '    from { opacity: 0; transform: translateX(0); }',
    '    to { opacity: 1; transform: translateX(var(--distance)); }',
    '}',
    '@scope (.card) to (.content) {',
    '    :scope { color: red; }',
    '}',
    '.card:hover::before { color: red; }'
  ].join('\n')
  const themeDirective = "@theme { :root, :host {\n    --color-primary: --alpha(var(--color-blue-60) / 80%);\n} }\n"
  const nativeBetween = [
    '@layer reset, theme, components;',
    '@media (width >= 48rem) {',
    '    .panel { color: red; }',
    '}',
    '@supports (container-type: inline-size) {',
    '    @container card (width > 30rem) {',
    '        @layer utilities {',
    '            .panel:is(.active, #featured) { animation: fade 1s ease-in-out; }',
    '        }',
    '    }',
    '}'
  ].join('\n')
  const utilitiesDirective = "@mixin --text-left {\n        @safelist \"center fg-red\";\n        text-align: left;\n    }\n@mixin --text-right {\n        @safelist \"center fg-red\";\n        text-align: right;\n    }"
  const safelistDirective = "@safelist \"sr-only fg-blue\";"
  const content = [
    nativeBefore,
    themeDirective,
    safelistDirective,
    nativeBetween,
    utilitiesDirective
  ].join('\n\n')
  const doc = createDoc('css', content)
  const languageService = new CSSLanguageService()
  const semanticTokens = languageService.renderSemanticTokens(doc)
  const tokens = decodeSemanticTokenRanges(doc, semanticTokens?.data ?? [])
  const classListRanges = ["sr-only fg-blue", "center fg-red"].flatMap(classList => {
    const ranges = []
    let start = content.indexOf(classList)
    while (start !== -1) {
      ranges.push({ start, end: start + classList.length })
      start = content.indexOf(classList, start + classList.length)
    }
    return ranges
  })
  const themeStart = content.indexOf(themeDirective)
  const themeEnd = themeStart + themeDirective.length
  const masterRanges = [safelistDirective, utilitiesDirective].map((directive) => {
    const start = content.indexOf(directive)
    return { start, end: start + directive.length }
  })
  const isInsideMasterRange = ({ start, end }: { start: number, end: number }) =>
    masterRanges.some((range) => range.start <= start && end <= range.end)
  const expectNoTokenOverlaps = (text: string, from = 0) => {
    const start = content.indexOf(text, from)
    expect(start).toBeGreaterThanOrEqual(0)
    const end = start + text.length
    expect(tokens.some((token) => token.start < end && token.end > start)).toBe(false)
  }

  expect(tokens.length).toBeGreaterThan(0)
  expect(tokens.every(isInsideMasterRange)).toBe(true)
  expect(tokens.every((token) => classListRanges.some((range) => range.start <= token.start && token.end <= range.end))).toBe(true)
  expect(tokens.map(({ text }) => text)).toEqual(expect.arrayContaining([
    "sr-only",
    'fg-blue',
    "center",
    'fg-red'
  ]))
  expect(tokens.some((token) => token.start < themeEnd && token.end > themeStart)).toBe(false)
  expectNoTokenOverlaps('@keyframes')
  expectNoTokenOverlaps('fade')
  expectNoTokenOverlaps('from')
  expectNoTokenOverlaps('to')
  expectNoTokenOverlaps('.card')
  expectNoTokenOverlaps('opacity')
  expectNoTokenOverlaps('translateX')
  expectNoTokenOverlaps('red')
})

test.concurrent('renders CSS directives in SCSS-like sources', () => {
  const { tokens } = renderTokens("\n    $color: red;\n\n    @theme { :root, :host {\n      --color-primary: #123;\n    } }\n\n\n    .btn {\n      @safelist \"center\";\n    }\n  ", 'scss')

  expectToken(tokens, "center", 'enumMember')
  expect(tokens).not.toContainEqual({ text: '@theme', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--color-primary', type: 'variable', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword', modifiers: ['directive'] })
})

test.concurrent('renders detailed CSS directive semantic tokens only for class-list syntax', () => {
  const { tokens } = renderTokens("\n    @source not \"src/**/*.{ts,tsx}\";\n    @reference \"./tokens.css\";\n    @blocklist \"debug-*\";\n    @safelist \"center fg-red:hover@md\";\n\n    @theme { .static brand {\n      --color-primary: --alpha(var(--color-blue-60) / 80%);\n      --radius-card: 1rem;\n    } }\n\n\n    @custom-variant headings { @variant all { @slot; } }\n\n    @mixin --btn {\n        @safelist \"fit align-items:center fg-primary:hover@md\";\n\n        @variant h>=sm&h<lg {\n          @safelist \"center\";\n        }\n\n        ::scrollbar-thumb:hover {\n          @media (prefers-color-scheme: dark) {\n            @safelist \"fg-primary\";\n          }\n        }\n      }\n\n    @utility text-decoration-* from(--color-*) {\n        text-decoration: var(--value);\n      }\n  ", 'css', { manifest: createPresetManifest({ variables: [{ namespace: 'color', key: 'primary', values: [{ path: [':root,:host'], value: '#4f46e5' }] }] }) })

  expectToken(tokens, "center", 'enumMember')
  expectToken(tokens, 'fg-red', 'enumMember')
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, '@md', 'keyword', ['query'])
  expectToken(tokens, "fit", 'enumMember')
  expectToken(tokens, 'align-items', 'property')
  expectToken(tokens, 'center', 'enumMember')
  expectToken(tokens, 'fg-primary', 'enumMember')
  expect(tokens).not.toContainEqual({ text: '@source', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'not', type: 'modifier', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@reference', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@blocklist', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@safelist', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@theme', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'static', type: 'modifier', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'brand', type: 'enumMember', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--color-primary', type: 'variable', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '--color-blue-60', type: 'variable', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '@custom-variant', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'headings', type: 'variable', modifiers: ['directive', 'query'] })
  expect(tokens).not.toContainEqual({ text: '@slot', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'btn', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@variant', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '@h', type: 'keyword', modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: '>=', type: 'operator', modifiers: ['query', 'queryOperator'] })
  expect(tokens).not.toContainEqual({ text: 'lg', type: 'enumMember', modifiers: ['query'] })
  expect(tokens).not.toContainEqual({ text: 'scrollbar-thumb', type: 'modifier', modifiers: ['pseudoElement'] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'text-decoration', type: 'property', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: 'color', type: 'variable', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--value', type: 'function', modifiers: [] })
  expect(tokens.some(({ text }) => text.includes('src/**/*'))).toBe(false)
  expect(tokens.some(({ text }) => text.includes('tokens.css'))).toBe(false)
  expect(tokens.some(({ text }) => text.includes('debug-'))).toBe(false)
  expect(tokens).not.toContainEqual({ text: 'h1', type: 'type', modifiers: ['selector'] })
})

test.concurrent('renders CSS directives in LESS-like sources', () => {
  const { tokens } = renderTokens("\n    @color: red;\n\n    @theme {:root, :host {\n      --color-primary: oklch(99% 0.0033 72);\n    }}\n\n\n    \n      @utility font:<~font-size|number> {\n        font-size: var(--value);\n\n        @media (prefers-color-scheme: light) {\n          color: var(--color-primary);\n        }\n      }\n    \n  ", 'less')

  expect(tokens).toEqual([])
})

test.concurrent('does not synthesize a closing directive brace for incomplete CSS blocks', () => {
  const { tokens } = renderTokens('@theme { --color-primary: red;', 'css')

  expect(tokens).toEqual([])
})

test.concurrent('shares class position detection with semantic token spans', () => {
  const doc = createDoc('tsx', "const x = clsx(\"fg-red\", condition && `center`)")
  const languageService = new CSSLanguageService()

  expect(languageService.getClassPositions(doc).map((classPosition) => classPosition.token)).toEqual([
    'fg-red',
    "center"
  ])
})

test.concurrent('renders active semantic tokens for the class context at a position', () => {
  const content = "<div className=\"fg-red center:hover\"></div>"
  const doc = createDoc('tsx', content)
  const languageService = new CSSLanguageService()
  const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf("center") + 1))
  const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

  expectToken(tokens, 'fg-red', 'enumMember')
  expectToken(tokens, "center", 'enumMember')
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
})

test.concurrent('renders active semantic tokens for a class context when the cursor is on whitespace', () => {
  const content = "<div className=\"fg-red center:hover p-md\"></div>"
  const doc = createDoc('tsx', content)
  const languageService = new CSSLanguageService()
  const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf(" center")))
  const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

  expectToken(tokens, 'fg-red', 'enumMember')
  expectToken(tokens, "center", 'enumMember')
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expectToken(tokens, 'p-md', 'enumMember')
})

test.concurrent('renders active semantic tokens only for the current class string context', () => {
  const content = "const x = clsx(\"fg-red center\", condition && \"p-md full\")"
  const doc = createDoc('tsx', content)
  const languageService = new CSSLanguageService()
  const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf("full") + 1))
  const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

  expectToken(tokens, 'p-md', 'enumMember')
  expectToken(tokens, "full", 'enumMember')
  expect(tokens.some(({ text }) => text === 'fg-red' || text === "center")).toBe(false)
})

test.concurrent('skips full embedded semantic tokens in active mode', () => {
  const content = "<div className=\"fg-red center:hover\"></div>"
  const doc = createDoc('tsx', content)
  const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'active' })

  expect(languageService.renderSemanticTokens(doc)).toBeUndefined()
})

test.concurrent('does not render active semantic tokens for CSS directive syntax at a position', () => {
  const content = "@theme { .dark { --color-primary: --alpha(var(--color-blue-60) / 80%); } }\n\n.btn { color: red; }"
  const doc = createDoc('css', content)
  const languageService = new CSSLanguageService()
  const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('dark') + 1))
  const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

  expect(tokens).toEqual([])
})

test.concurrent('renders active semantic tokens for CSS directive class-list spans', () => {
  const content = "@mixin --btn { @safelist \"fg-red center:hover\"; }"
  const doc = createDoc('css', content)
  const languageService = new CSSLanguageService()
  const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf("center") + 1))
  const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

  expectToken(tokens, 'fg-red', 'enumMember')
  expectToken(tokens, "center", 'enumMember')
  expectToken(tokens, 'hover', 'modifier', ['pseudoClass'])
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'btn', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword', modifiers: ['directive'] })
})

test.concurrent('does not render active semantic tokens for custom variant blocks', () => {
  const content = [
    '@custom-variant motion-safe {',
    '    @media (prefers-reduced-motion: no-preference) {',
    '        @slot;',
    '    }',
    '}',
    '@custom-variant print-only {',
    '    @media print {',
    '        @slot;',
    '    }',
    '}'
  ].join('\n')
  const doc = createDoc('css', content)
  const languageService = new CSSLanguageService()
  const semanticTokens = languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf('prefers-reduced-motion') + 1))
  const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

  expect(tokens).toEqual([])
})

test.concurrent('skips embedded semantic tokens when syntax highlighting is off', () => {
  const content = "<div className=\"fg-red center:hover\"></div>"
  const doc = createDoc('tsx', content)
  const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'off' })

  expect(languageService.renderSemanticTokens(doc)).toBeUndefined()
  expect(languageService.renderSemanticTokensAtPosition(doc, doc.positionAt(content.indexOf("center") + 1))).toBeUndefined()
})

test.concurrent('renders CSS directive class-list semantic tokens when embedded highlighting is off', () => {
  const content = "@theme { .dark { --color-primary: --alpha(var(--color-blue-60) / 80%); } }\n\n@mixin --btn { @safelist \"center\"; }"
  const doc = createDoc('css', content)
  const languageService = new CSSLanguageService({ embeddedSyntaxHighlighting: 'off' })
  const semanticTokens = languageService.renderSemanticTokens(doc)
  const tokens = decodeSemanticTokens(doc, semanticTokens?.data ?? [])

  expectToken(tokens, "center", 'enumMember')
  expect(tokens).not.toContainEqual({ text: '@theme', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'dark', type: 'enumMember', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: '--color-primary', type: 'variable', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '--color-blue-60', type: 'variable', modifiers: [] })
  expect(tokens).not.toContainEqual({ text: '@utilities', type: 'keyword', modifiers: ['directive'] })
  expect(tokens).not.toContainEqual({ text: 'btn', type: 'class', modifiers: ['selector'] })
  expect(tokens).not.toContainEqual({ text: '@compose', type: 'keyword', modifiers: ['directive'] })
})
