import { expect, test } from 'vitest'

import {
  collectBrowserSemanticTokenItems,
  renderBrowserSemanticTokens
} from './helpers/rc87-browser-compat'
import { SEMANTIC_TOKEN_MODIFIERS, SEMANTIC_TOKEN_TYPES } from '@master/css-tooling/language'
import { createPresetManifest } from './helpers/create-preset-manifest'

const manifest = createPresetManifest({
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

function tokenText(source: string, token: { start: number, end: number }) {
  return source.slice(token.start, token.end)
}

function decodeSingleLineBrowserSemanticTokens(source: string, data: ArrayLike<number>) {
  const tokens: { text: string, type: string, modifiers: string[], modifierBits: number }[] = []
  let character = 0
  for (let i = 0; i < data.length; i += 5) {
    expect(data[i]).toBe(0)
    character += data[i + 1]
    const length = data[i + 2]
    const modifierBits = data[i + 4]
    const start = character
    tokens.push({
      text: source.slice(start, start + length),
      type: SEMANTIC_TOKEN_TYPES[data[i + 3]],
      modifiers: SEMANTIC_TOKEN_MODIFIERS.filter((_, index) => modifierBits & (1 << index)),
      modifierBits
    })
  }
  return tokens
}

test.concurrent('collects browser semantic tokens for HTML class attributes', () => {
  const source = "<div class=\"text-align:center fg-brand sr-only btn\"></div>"
  const tokens = collectBrowserSemanticTokenItems(source, 'html', { manifest })
  const mapped = tokens.map((token) => ({
    text: tokenText(source, token),
    type: token.type,
    modifiers: token.modifiers || []
  }))

  expect(mapped).toEqual(expect.arrayContaining([
    { text: 'text-align', type: 'property' as const, modifiers: [] },
    { text: 'sr-only', type: 'enumMember' as const, modifiers: [] },
    { text: 'fg-brand', type: 'enumMember' as const, modifiers: [] },
    { text: "sr-only", type: 'enumMember' as const, modifiers: [] },
    { text: 'btn', type: 'enumMember' as const, modifiers: [] }
  ]))
})

test.concurrent('encodes browser role-derived semantic token modifiers', () => {
  const source = "<div class=\"fg-red>li:hover@sm sr-only>li:hover@sm\"></div>"
  const semanticTokens = renderBrowserSemanticTokens(source, 'html', { manifest })
  const tokens = decodeSingleLineBrowserSemanticTokens(source, semanticTokens?.data || [])
  const selectorCombinatorIndex = SEMANTIC_TOKEN_MODIFIERS.indexOf('selectorCombinator')

  expect(tokens).toEqual(expect.arrayContaining([
    { text: 'fg-red', type: 'enumMember' as const, modifiers: [], modifierBits: 0 },
    { text: '>', type: 'operator' as const, modifiers: ['selector', 'selectorCombinator'], modifierBits: (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('selector')) | (1 << selectorCombinatorIndex) },
    { text: ':', type: 'operator' as const, modifiers: ['pseudoClass', 'selector', 'pseudoClassDelimiter'], modifierBits: (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('pseudoClass')) | (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('selector')) | (1 << SEMANTIC_TOKEN_MODIFIERS.indexOf('pseudoClassDelimiter')) }
  ]))
  expect(selectorCombinatorIndex).toBeGreaterThan(SEMANTIC_TOKEN_MODIFIERS.indexOf('unit'))
})

test.concurrent('collects browser semantic tokens only for CSS directive class-list spans', () => {
  const source = "\n    @safelist \"sr-only fg-red\";\n\n    @theme { :root, :host {\n      --color-brand: var(--brand, #123);\n\n      \n    } }\n@keyframes fade {\n        to {\n          opacity: 1;\n        }\n      }\n\n\n    @mixin --btn {\n        @safelist \"sr-only fg-brand\";\n        &:hover {\n          color: var(--brand, red);\n        }\n      }\n  "
  const tokens = collectBrowserSemanticTokenItems(source, 'css', { manifest })
  const mapped = tokens.map((token) => ({
    text: tokenText(source, token),
    type: token.type,
    modifiers: token.modifiers || []
  }))

  expect(mapped).toEqual(expect.arrayContaining([
    { text: "sr-only", type: 'enumMember' as const, modifiers: [] },
    { text: 'fg-red', type: 'enumMember' as const, modifiers: [] },
    { text: "sr-only", type: 'enumMember' as const, modifiers: [] },
    { text: 'fg-brand', type: 'enumMember' as const, modifiers: [] }
  ]))
  expect(mapped).not.toContainEqual({ text: '@theme', type: 'keyword' as const, modifiers: ['directive'] })
  expect(mapped).not.toContainEqual({ text: '--color-brand', type: 'variable' as const, modifiers: [] })
  expect(mapped).not.toContainEqual({ text: '@utilities', type: 'keyword' as const, modifiers: ['directive'] })
  expect(mapped).not.toContainEqual({ text: 'btn', type: 'class' as const, modifiers: ['selector'] })
  expect(mapped).not.toContainEqual({ text: '@compose', type: 'keyword' as const, modifiers: ['directive'] })
  expect(mapped).not.toContainEqual({ text: 'var', type: 'function' as const, modifiers: [] })
  expect(mapped).not.toContainEqual({ text: '@keyframes', type: 'keyword' as const, modifiers: [] })
})

test.concurrent('does not collect browser semantic tokens for managed syntax without class-list spans', () => {
  const source = "\n    @mixin --motion-safe {\n      @media (prefers-reduced-motion: no-preference) {\n        @contents;\n      }\n    }\n\n    \n      @utility font-* from(--font-size-*) {\n        font-size: var(--value);\n\n        @media (prefers-color-scheme: light) {\n          color: var(--color-brand);\n        }\n      }\n    \n  "
  const tokens = collectBrowserSemanticTokenItems(source, 'css', { manifest })

  expect(tokens).toEqual([])
})

test.concurrent('encodes browser semantic tokens', () => {
  const source = '<div class="btn"></div>'
  const semanticTokens = renderBrowserSemanticTokens(source, 'html', { manifest })
  const data = [...(semanticTokens?.data || [])]
  const typeIndex = SEMANTIC_TOKEN_TYPES.indexOf('enumMember')

  expect(data).toHaveLength(5)
  expect(data[3]).toBe(typeIndex)
  expect(data[4]).toBe(0)
})
