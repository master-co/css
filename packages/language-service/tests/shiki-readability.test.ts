import { expect, test } from 'vitest'
import { createHighlighter } from 'shiki'
import { masterCSSShikiLanguage, transformerMasterCSS } from '../src/shiki'
import { createPresetManifest } from './helpers/create-preset-manifest'

const themes = { light: 'min-light', dark: 'dracula' } as const
const options = { lang: 'css' as const, themes, defaultColor: false as const, includeExplanation: 'scopeName' as const }

function colors(token: any) {
  return {
    light: token.htmlStyle?.['--shiki-light'],
    dark: token.htmlStyle?.['--shiki-dark']
  }
}

function hasScope(token: any, scope: string) {
  return token.explanation?.some((part: any) => (
    part.content === token.content && part.scopes?.some((entry: any) => entry.scopeName === scope)
  )) ?? false
}

function semanticQueryStyle(root: any) {
  const visit = (node: any): string | undefined => {
    if (node.tagName === 'span' && node.children?.length === 1 && node.children[0]?.value === '@md'
      && String(node.properties?.class).includes('mcss-semantic-keyword-query')) {
      return node.properties?.style
    }
    for (const child of node.children ?? []) {
      const style = visit(child)
      if (style) return style
    }
  }
  const style = visit(root)
  expect(style).toBeDefined()
  return Object.fromEntries((style as string).split(';').map((part) => part.split(':')))
}

test('colors every complete Master directive like a native CSS at-rule', async () => {
  const highlighter = await createHighlighter({ langs: ['css', masterCSSShikiLanguage], themes: Object.values(themes) })
  const native = highlighter.codeToTokens('@import "base.css";', options).tokens[0].find((token) => token.content === '@import')
  expect(native).toBeDefined()

  const directives = [
    ['source', '@source "src/**/*";'],
    ['safelist', '@safelist "btn";'],
    ['blocklist', '@blocklist "debug-*";'],
    ['preserve', '@preserve native;'],
    ['reference', '@reference "./tokens.css";'],
    ['theme', "@theme {}\n"],
    ['utility', '@utility box {}'],
    ['custom-variant', '@custom-variant motion-safe {}'],
    ['variant', '@variant sm {}'],
    ['slot', '@slot;'],
  ] as const

  try {
    for (const [name, source] of directives) {
      const tokens = highlighter.codeToTokens(source, options).tokens[0]
      const keyword = tokens.filter((token) => token.content === `@${name}`)
      expect(keyword, source).toHaveLength(1)
      expect(hasScope(keyword[0], 'keyword.control.at-rule.master-css'), source).toBe(true)
      expect(colors(keyword[0]), source).toEqual(colors(native))
      expect(tokens.some((token) => token.content === '@'), source).toBe(false)
    }
  } finally {
    await highlighter.dispose?.()
  }
})

test('colors query names and keeps nested native at-rules in the CSS grammar', async () => {
  const highlighter = await createHighlighter({ langs: ['css', masterCSSShikiLanguage], themes: Object.values(themes) })

  try {
    const nativeKeyword = highlighter.codeToTokens('@media (width > 1px) {}', options).tokens[0].find((token) => token.content === '@media')
    expect(nativeKeyword).toBeDefined()

    const compose = highlighter.codeToTokens("@utility btn { @safelist \"fg-red:hover@md\"; }", options).tokens[0]
    const query = compose.find((token) => token.content === '@md')
    expect(query).toBeDefined()
    expect(hasScope(query, 'keyword.control.at-rule.master-css.query')).toBe(true)
    expect(colors(query)).toEqual(colors(nativeKeyword))
    expect(compose.some((token) => token.content === '@' && hasScope(token, 'punctuation.definition.keyword.master-css'))).toBe(false)

    const tokens = highlighter.codeToTokens('@utility card { @variant sm { color: red; } }', options).tokens[0]
    const name = tokens.find(token => token.content === 'sm')
    expect(name).toBeDefined()
    expect(hasScope(name, 'support.constant.property-value.master-css.query')).toBe(true)

    for (const [atRule, condition] of [
      ['@media', '(prefers-reduced-motion: no-preference)'],
      ['@supports', '(display: grid)'],
      ['@container', '(min-width: 30rem)']
    ] as const) {
      const native = highlighter.codeToTokens(`${atRule} ${condition} {}`, options).tokens[0].find((token) => token.content === atRule)
      const tokens = highlighter.codeToTokens(`@custom-variant motion-safe { ${atRule} ${condition} { @slot; } }`, options).tokens[0]
      const nested = tokens.find((token) => token.content === atRule)
      expect(nested, atRule).toBeDefined()
      expect(colors(nested), atRule).toEqual(colors(native))
      expect(hasScope(nested, 'keyword.control.at-rule.master-css.query'), atRule).toBe(false)
      expect(tokens.some((token) => token.content === '@slot' && hasScope(token, 'keyword.control.at-rule.master-css')), atRule).toBe(true)
      expect(tokens.some((token) => token.content.includes('no-preference') && hasScope(token, 'entity.name.tag.master-css')), atRule).toBe(false)
    }

    const managed = highlighter.codeToTokens("@utility btn { @media (width > 30rem) { @safelist \"block\"; } }", options).tokens[0]
    expect(colors(managed.find((token) => token.content === '@media'))).toEqual(colors(nativeKeyword))
    expect(managed.some((token) => token.content === '@safelist' && hasScope(token, 'keyword.control.at-rule.master-css'))).toBe(true)
  } finally {
    await highlighter.dispose?.()
  }
})

test('keeps semantic query colors aligned in CSS, HTML, and TSX', async () => {
  const highlighter = await createHighlighter({ langs: ['css', 'html', 'tsx', masterCSSShikiLanguage], themes: Object.values(themes) })
  const native = highlighter.codeToTokens('@import "base.css";', options).tokens[0].find((token) => token.content === '@import')
  const manifest = createPresetManifest()

  try {
    for (const [lang, source] of [
      ['css', "@utility btn { @safelist \"fg-red@md\"; }"],
      ['html', '<div class="fg-red@md"></div>'],
      ['tsx', '<div className="fg-red@md" />']
    ] as const) {
      const hast = highlighter.codeToHast(source, {
        ...options,
        lang,
        transformers: [transformerMasterCSS({ manifest }) as any]
      })
      const style = semanticQueryStyle(hast)
      expect({ light: style['--shiki-light'], dark: style['--shiki-dark'] }, lang).toEqual(colors(native))
    }
  } finally {
    await highlighter.dispose?.()
  }
})

test('ignores unrelated explanations when probing semantic scope colors', () => {
  const source = '<div class="fg-red@md"></div>'
  const explanation = [
    { content: '@', scopes: [{ scopeName: 'punctuation.definition.keyword.master-css' }] },
    { content: 'theme', scopes: [{ scopeName: 'keyword.control.at-rule.master-css' }] }
  ]
  const transformer = transformerMasterCSS({ manifest: createPresetManifest() })
  const tokens = transformer.tokens.call({
    source,
    options: { lang: 'html' },
    codeToTokens: () => ({
      tokens: [[
        { content: '@', offset: 0, htmlStyle: { color: 'punctuation' }, explanation },
        { content: 'theme', offset: 1, htmlStyle: { color: 'keyword' }, explanation }
      ]]
    })
  }, [[{ content: source, offset: 0, htmlStyle: { color: 'host' } }]])
  const keyword = tokens?.flat().find((token) => token.content === '@md')

  expect(keyword?.htmlStyle).toEqual({ color: 'keyword' })
})
