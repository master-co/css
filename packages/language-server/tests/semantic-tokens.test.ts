import { test } from 'vitest'
import { withFixture } from './setup'
import { ACTIVE_SEMANTIC_TOKENS_REQUEST, DOCUMENT_SEMANTIC_TOKENS_REQUEST } from '../src'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '@master/css-tooling/language'

function hasTokenType(data: number[], type: string) {
  return data.some((_, index) =>
    index % 5 === 3 && SEMANTIC_TOKEN_TYPES[data[index]] === type
  )
}

function hasTokenModifier(data: number[], modifier: typeof SEMANTIC_TOKEN_MODIFIERS[number]) {
  const modifierIndex = SEMANTIC_TOKEN_MODIFIERS.indexOf(modifier)
  return modifierIndex >= 0 && data.some((_, index) =>
    index % 5 === 4 && Boolean(data[index] & (1 << modifierIndex))
  )
}

withFixture('basic', async (context) => {
  test('omits full semantic token capability in active mode', async ({ expect }) => {
    expect(context.server.onInitialize({
      capabilities: {},
      workspaceFolders: context.workspaceFolders
    } as any).capabilities.semanticTokensProvider).toBeUndefined()
  })

  test('returns active semantic tokens for the class at a position', async ({ expect }) => {
    const text = '<div class="fg:red block:hover"></div>'
    const textDocument = context.createDocument(text)
    await context.server.onDidOpen({ document: textDocument })
    const semanticTokens = await context.clientConnection.sendRequest<{ data: number[] }>(ACTIVE_SEMANTIC_TOKENS_REQUEST, {
      textDocument: {
        uri: textDocument.uri
      },
      position: textDocument.positionAt(text.indexOf('block') + 1)
    })

    expect(semanticTokens.data.length).toBeGreaterThan(0)
    expect(semanticTokens.data.some((_: number, index: number) =>
      index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'enumMember'
    )).toBe(true)
    expect(semanticTokens.data.some((_: number, index: number) =>
      index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'property'
    )).toBe(true)
    await context.server.onDidClose({ document: textDocument })
  })

  test('returns CSS directive class-list semantic tokens in active mode', async ({ expect }) => {
    const textDocument = context.createDocument('@theme dark { --color-primary: --alpha(var(--color-blue-60) / 80%); }\n@components { btn { @compose fg:red block; } }', { lang: 'css' })
    await context.server.onDidOpen({ document: textDocument })
    const semanticTokens = await context.clientConnection.sendRequest<{ data: number[] }>(DOCUMENT_SEMANTIC_TOKENS_REQUEST, {
      textDocument: {
        uri: textDocument.uri
      }
    })

    expect(semanticTokens.data.length).toBeGreaterThan(0)
    expect(hasTokenType(semanticTokens.data, 'property')).toBe(true)
    expect(hasTokenType(semanticTokens.data, 'enumMember')).toBe(true)
    expect(hasTokenType(semanticTokens.data, 'keyword')).toBe(false)
    expect(hasTokenType(semanticTokens.data, 'variable')).toBe(false)
    expect(hasTokenType(semanticTokens.data, 'class')).toBe(false)
    await context.server.onDidClose({ document: textDocument })
  })

  test('returns no document semantic tokens for native CSS-only documents', async ({ expect }) => {
    const textDocument = context.createDocument([
      '@charset "utf-8";',
      '@import url("base.css") layer(theme) supports(display: grid);',
      '@namespace svg url("http://www.w3.org/2000/svg");',
      '@font-face {',
      '    font-family: "Inter";',
      '    src: url("/fonts/inter.woff2") format("woff2");',
      '    font-display: swap;',
      '}',
      '@property --angle {',
      '    syntax: "<angle>";',
      '    inherits: false;',
      '    initial-value: 0deg;',
      '}',
      '@counter-style bullets {',
      '    system: cyclic;',
      '    symbols: "*" "\\\\2022";',
      '    suffix: " ";',
      '}',
      '@font-feature-values Inter {',
      '    @styleset { nice: 1; }',
      '}',
      '@font-palette-values --brand {',
      '    font-family: "Bixa";',
      '    base-palette: 1;',
      '}',
      '@page :first {',
      '    margin: 1cm;',
      '    @top-left { content: "Chapter"; }',
      '}',
      '@position-try --bottom {',
      '    inset-area: bottom;',
      '}',
      '@view-transition {',
      '    navigation: auto;',
      '}',
      '@scope (.card) to (.content) {',
      '    :scope { color: red; }',
      '}',
      '@starting-style {',
      '    .card { opacity: 0; }',
      '}',
      '@document url("https://example.com/") {',
      '    body { color: red; }',
      '}',
      '@keyframes fade {',
      '    from { opacity: 0; }',
      '    to { opacity: 1; }',
      '}',
      '@layer reset, theme, components;',
      '@media (width >= 48rem) {',
      '    .btn:hover { color: red; content: "@utilities"; }',
      '}',
      '@supports (container-type: inline-size) {',
      '    @container card (width > 30rem) {',
      '        @layer components {',
      '            .btn:is(.active, #featured) { animation: fade 1s ease-in-out; }',
      '        }',
      '    }',
      '}'
    ].join('\n'), { lang: 'css' })
    await context.server.onDidOpen({ document: textDocument })
    const semanticTokens = await context.clientConnection.sendRequest<{ data: number[] }>(DOCUMENT_SEMANTIC_TOKENS_REQUEST, {
      textDocument: {
        uri: textDocument.uri
      }
    })

    expect(semanticTokens.data).toEqual([])
    await context.server.onDidClose({ document: textDocument })
  })
})

withFixture('basic', async (context) => {
  test('initializes full semantic token capability in always mode', async ({ expect }) => {
    expect(context.server.onInitialize({
      capabilities: {},
      workspaceFolders: context.workspaceFolders
    } as any).capabilities.semanticTokensProvider).toMatchObject({
      full: true,
      legend: {
        tokenTypes: expect.arrayContaining(['class', 'property', 'variable']),
        tokenModifiers: expect.arrayContaining(['declaration', 'declarationTerminator', 'selectorCombinator'])
      }
    })
  })

  test('returns full semantic tokens for opened documents', async ({ expect }) => {
    const textDocument = context.createDocument('<div class="{fg:red;block}>li:hover@sm"></div>')
    await context.server.onDidOpen({ document: textDocument })
    const semanticTokens = await context.server.onSemanticTokens({
      textDocument: {
        uri: textDocument.uri
      }
    } as any)

    expect(semanticTokens.data.length).toBeGreaterThan(0)
    expect(semanticTokens.data.some((_, index) =>
      index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'property'
    )).toBe(true)
    expect(semanticTokens.data.some((_, index) =>
      index % 5 === 3 && SEMANTIC_TOKEN_TYPES[semanticTokens.data[index]] === 'enumMember'
    )).toBe(true)
    expect(hasTokenModifier(semanticTokens.data, 'declarationTerminator')).toBe(true)
    expect(hasTokenModifier(semanticTokens.data, 'selectorCombinator')).toBe(true)
    await context.server.onDidClose({ document: textDocument })
  })
}, {
  embeddedSyntaxHighlighting: 'always'
})

withFixture('basic', async (context) => {
  test('omits semantic token capability when highlighting is off', async ({ expect }) => {
    expect(context.server.onInitialize({
      capabilities: {},
      workspaceFolders: context.workspaceFolders
    } as any).capabilities.semanticTokensProvider).toBeUndefined()
  })

  test('returns CSS directive class-list semantic tokens when highlighting is off', async ({ expect }) => {
    const textDocument = context.createDocument('@theme dark { --color-primary: --alpha(var(--color-blue-60) / 80%); }\n@components { btn { @compose block; } }', { lang: 'css' })
    await context.server.onDidOpen({ document: textDocument })
    const semanticTokens = await context.clientConnection.sendRequest<{ data: number[] }>(DOCUMENT_SEMANTIC_TOKENS_REQUEST, {
      textDocument: {
        uri: textDocument.uri
      }
    })

    expect(semanticTokens.data.length).toBeGreaterThan(0)
    expect(hasTokenType(semanticTokens.data, 'enumMember')).toBe(true)
    expect(hasTokenType(semanticTokens.data, 'keyword')).toBe(false)
    expect(hasTokenType(semanticTokens.data, 'variable')).toBe(false)
    expect(hasTokenType(semanticTokens.data, 'class')).toBe(false)
    await context.server.onDidClose({ document: textDocument })
  })
}, {
  embeddedSyntaxHighlighting: 'off'
})
