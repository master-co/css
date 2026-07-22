import { beforeAll, expect, test } from 'vitest'
import { inspectMasterCSSClass } from '@master/css-engine/inspect'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createLanguageCSS } from '../src/master-css'
import { encodeSemanticTokens } from '../src/semantic/encode'
import { createRustLanguageAnalyzer } from '../src/rust-session'
import type { SemanticTokenItem } from '../src/semantic/types'
import { createPresetManifest } from './helpers/create-preset-manifest'

beforeAll(() => {
  process.env.MASTER_CSS_NATIVE_BINDING_PATH = new URL(
    '../../native/artifacts/mastercss.node',
    import.meta.url
  ).pathname
})

test('matches UTF-16 class ranges and semantic token encoding', async () => {
  const source = '😀 <div class="fg:red  content:\\`\\`">\r\n<span></span>'
  const classList = 'fg:red  content:\\`\\`'
  const start = source.indexOf(classList)
  const end = start + classList.length
  const tokens: SemanticTokenItem[] = [
    { start, end: start + 2, type: 'property', modifiers: ['declaration'] },
    { start: start + 3, end: start + 6, type: 'keyword' },
    { start: start + 8, end, type: 'string', modifiers: ['quoted'] }
  ]
  const analyzer = await createRustLanguageAnalyzer()
  const batch = analyzer.analyze(source, [{ start, end, unescape: ['`'] }], tokens)
  const document = TextDocument.create('file:///test.html', 'html', 1, source)

  expect(batch.version).toBe(1)
  expect(batch.classPositions).toEqual([
    {
      range: { start, end: start + 6 },
      contextRange: { start, end },
      raw: 'fg:red',
      token: 'fg:red'
    },
    {
      range: { start: start + 8, end },
      contextRange: { start, end },
      raw: 'content:\\`\\`',
      token: 'content:``'
    }
  ])
  expect(batch.semanticTokenData).toEqual(encodeSemanticTokens(document, tokens).data)
})

test('batches manifest-driven class semantic classification', async () => {
  const analyzer = await createRustLanguageAnalyzer()
  const session = analyzer.createSession?.(createPresetManifest({
    utilities: [{ name: 'rust-card', layer: 'components', declarations: { display: 'block' } }]
  }))
  expect(session).toBeDefined()
  try {
    expect(session?.classifyClassNames?.([
      'rust-card:hover',
      'fg:red',
      'unknown-class'
    ])).toMatchObject({
      version: 1,
      classes: [
        { className: 'rust-card:hover', kind: 'component', stateToken: ':hover' },
        { className: 'fg:red', kind: 'declaration', keyToken: 'fg:', valueToken: 'red' },
        { className: 'unknown-class', kind: 'unknown' }
      ]
    })
  } finally {
    session?.dispose?.()
  }
})

test('matches TS class inspection fields, variables, rules, and forced modes', async () => {
  const analyzer = await createRustLanguageAnalyzer()
  const manifest = createPresetManifest({
    settings: { modeTrigger: 'class' },
    variables: [{
      namespace: 'color',
      key: 'rust-brand',
      value: '#123456',
      dependencies: ['spacing-4']
    }]
  })
  const session = analyzer.createSession?.(manifest)
  const css = createLanguageCSS(manifest)
  expect(session?.inspectClassName).toBeDefined()
  try {
    for (const [className, mode] of [
      ['fg:rust-brand:hover', undefined],
      ['block', 'dark'],
      ['made-up:nope:hover', undefined]
    ] as const) {
      const actual = session?.inspectClassName?.(className, mode)
      const expected = inspectMasterCSSClass(css, className, mode)
      expect(actual).toMatchObject({
        className,
        valid: expected.rules.length > 0,
        base: expected.base,
        suffix: expected.suffix,
        ...(expected.key !== undefined ? { key: expected.key } : {}),
        ...(expected.value !== undefined ? { value: expected.value } : {}),
        ...(expected.keyToken !== undefined ? { keyToken: expected.keyToken } : {}),
        ...(expected.valueToken !== undefined ? { valueToken: expected.valueToken } : {}),
        ...(expected.stateToken !== undefined ? { stateToken: expected.stateToken } : {}),
        important: Boolean(expected.important),
        matcherTypes: expected.matcherTypes,
        variables: expected.variableEntries.map(({ key, variable }) => ({
          key,
          variable: {
            ...variable,
            ...(variable.dependencies
              ? { dependencies: [...variable.dependencies] }
              : {})
          }
        })),
        rules: expected.rules.map((rule) => ({
          className: rule.name,
          layer: rule.layerName,
          type: rule.type,
          text: rule.text
        }))
      })
    }
  } finally {
    session?.dispose?.()
    css.destroy()
  }
})
