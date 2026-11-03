import { expect, test } from 'vitest'
import { createHighlighter } from 'shiki'
import sharedTextMateGrammar from '../syntaxes/master-css.tmLanguage.json' with { type: 'json' }
import { MASTER_CSS_TEXTMATE_GRAMMAR, masterCSSShikiLanguage } from '../src/shiki'
const shikiSmokeTheme = 'github-dark'
function expectTokensPreserveSource(tokens: { content: string }[][], code: string) {
  expect(tokens.map(line => line.map(token => token.content).join(''))).toEqual(code.split('\n'))
}

interface TextMatePattern {
  include?: string
  begin?: string
  match?: string
  name?: string
  patterns?: TextMatePattern[]
  beginCaptures?: Record<string, { name?: string }>
  captures?: Record<string, { name?: string }>
}

function grammarEntry(key: string) {
  const entry = MASTER_CSS_TEXTMATE_GRAMMAR.repository[key] as { patterns?: TextMatePattern[] } | undefined
  expect(entry?.patterns).toBeDefined()
  return entry as { patterns: TextMatePattern[] }
}

function findGrammarPattern(entry: { patterns: TextMatePattern[] }, predicate: (pattern: TextMatePattern) => boolean) {
  const pattern = entry.patterns.find(predicate)
  expect(pattern).toBeDefined()
  return pattern as TextMatePattern
}

function expectGrammarIncludes(entry: { patterns: TextMatePattern[] }, includes: string[]) {
  expect(entry.patterns).toEqual(expect.arrayContaining(
    includes.map((include) => expect.objectContaining({ include }))
  ))
}

test.concurrent('exports the Shiki language registration as a named value', async () => {
  const shikiModule = await import('../src/shiki')
  expect(shikiModule.masterCSSShikiLanguage).toBe(masterCSSShikiLanguage)
  expect('default' in shikiModule).toBe(false)
})

test.concurrent('defines deterministic directive scopes with native blocks', () => {
  expect(MASTER_CSS_TEXTMATE_GRAMMAR).toBe(sharedTextMateGrammar)
  expect(masterCSSShikiLanguage.scopeName).toBe(sharedTextMateGrammar.scopeName)
  const directive = grammarEntry('master-directive')
  for (const name of ['theme', 'utility|apply|mixin(?=\\s+--)', 'safelist', 'contents']) {
    const pattern = findGrammarPattern(directive, pattern => pattern.begin === `(?i)(@)(${name})\\b`)
    expect(pattern.beginCaptures?.['0']?.name).toBe('keyword.control.at-rule.master-css')
  }
  const utility = findGrammarPattern(directive, pattern => pattern.begin?.includes('(utility|apply|mixin') === true)
  expectGrammarIncludes({ patterns: utility.patterns ?? [] }, ['#master-block', '#master-mixin-prelude'])
  expect(MASTER_CSS_TEXTMATE_GRAMMAR.repository).not.toHaveProperty('master-compose-prelude')
  expect(MASTER_CSS_TEXTMATE_GRAMMAR.repository).not.toHaveProperty('master-theme-prelude')
  const classFragment = grammarEntry('master-class-fragment')
  findGrammarPattern(classFragment, pattern => pattern.name === 'keyword.control.at-rule.master-css.query')
})

test('loads the grammar through a dynamic Shiki language import', async () => {
  const masterCSSShikiLanguageImport = import('../src/shiki').then((module) => ({
    default: [module.masterCSSShikiLanguage]
  }))
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguageImport]
  })

  try {
    expect(highlighter.getLoadedLanguages()).toEqual(expect.arrayContaining(['css', masterCSSShikiLanguage.name]))

    const code = `@theme {
  --color-primary: var(--value);
}
`
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

test('registers a real Shiki TextMate injection grammar for CSS directives', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguage]
  })

  try {
    expect(highlighter.getLoadedLanguages()).toEqual(expect.arrayContaining(['css', masterCSSShikiLanguage.name]))

    const code = `@theme {
  --color-primary: var(--color-blue-60);
}

@mixin --btn {
        @safelist "(display:inline-flex) fg-primary:hover@md";
    } @utility btn {
        @safelist "(display:inline-flex) fg-primary:hover@md";
    }
@keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
}`
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

test('preserves guide theme source through TextMate tokenization', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguage]
  })

  try {
    const code = `@theme {
  --tracking-tightest: -0.072em;
}

.light {
    /* Font families */
    --tracking-tightest: -0.072em;
}
`
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})


test('scopes a parenthesized declaration head like its semantic tokens', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguage]
  })

  try {
    const code = '@safelist "(color:red):hover (--x:1)";'
    const parts = highlighter.codeToTokens(code, { lang: 'css', theme: shikiSmokeTheme, includeExplanation: 'scopeName' }).tokens
      .flat()
      .flatMap(token => token.explanation ?? [])
      .map(({ content, scopes }) => ({ content, scopes: scopes.map(({ scopeName }) => scopeName) }))
    const head = parts.slice(parts.findIndex(({ content }) => content === '('))

    // Semantic tokens: `(` blockBrace, property, `:` declarationSeparator, value, then the selector suffix.
    expect(head.slice(0, 4)).toEqual([
      { content: '(', scopes: expect.arrayContaining(['punctuation.section.declaration.begin.master-css']) },
      { content: 'color', scopes: expect.arrayContaining(['support.type.property-name.master-css']) },
      { content: ':', scopes: expect.arrayContaining(['punctuation.separator.key-value.master-css']) },
      { content: 'red', scopes: expect.arrayContaining(['support.constant.property-value.master-css']) }
    ])
    expect(head.find(({ content }) => content === 'hover')?.scopes).toContain('entity.other.attribute-name.pseudo-class.master-css')
    expect(head.find(({ content }) => content === '--x')?.scopes).toContain('support.type.property-name.master-css')
  } finally {
    await highlighter.dispose?.()
  }
})

test('scopes custom containers, mixin names, Sass mixins and safelisted values', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', 'scss', masterCSSShikiLanguage]
  })

  try {
    const scopesOf = (code: string, lang: 'css' | 'scss' = 'css') => new Map(highlighter.codeToTokens(code, { lang, theme: shikiSmokeTheme, includeExplanation: 'scopeName' }).tokens
      .flat()
      .flatMap(token => token.explanation ?? [])
      .map(({ content, scopes }) => [content.trim(), scopes.map(({ scopeName }) => scopeName).at(-1)]))

    const container = scopesOf('@custom-container --dense (--md) and style(--density: compact);')
    expect(container.get('--dense')).toBe('support.type.property-name.custom.css')
    expect(container.get('--md')).toBe('support.type.property-name.custom.css')
    expect(container.get('and')).toBe('keyword.operator.logical.feature.master-css')
    expect(container.get('style')).toBe('support.function.misc.css')
    expect(container.get(';')).toBe('punctuation.terminator.rule.css')
    expect(scopesOf('@custom-container --md (width >= 28rem);').get('width')).toBe('support.type.property-name.media.css')

    expect(scopesOf('@mixin --card() {').get('--card')).toBe('entity.name.function.mixin.master-css')
    expect(scopesOf('.card { @apply --card; }').get('--card')).toBe('entity.name.function.mixin.master-css')
    expect(scopesOf('@mixin stack { display: flex; }', 'scss').get('stack')).toBe('entity.name.function.scss')

    const safelist = scopesOf('@safelist "(opacity:.5)" "(color:#fff|rgb(0|0|0/50%))";')
    expect(safelist.get('.5')).toBe('constant.numeric.master-css')
    expect(safelist.get('#fff')).toBe('constant.other.color.rgb-value.hex.master-css')
    expect(safelist.get('rgb')).toBe('support.function.misc.master-css')
    expect(safelist.get('|')).toBe('punctuation.separator.list.master-css')
  } finally {
    await highlighter.dispose?.()
  }
})

test('semantic pseudo-class names take the pseudo-class color, not their delimiter color', async () => {
  const { transformerMasterCSS } = await import('../src/shiki')
  const highlighter = await createHighlighter({
    themes: [{
      name: 'distinct-pseudo',
      type: 'dark',
      settings: [
        { settings: { foreground: '#ffffff' } },
        { scope: 'punctuation', settings: { foreground: '#111111' } },
        { scope: 'entity.other.attribute-name.pseudo-class', settings: { foreground: '#222222' } },
        { scope: 'string', settings: { foreground: '#333333' } }
      ]
    }],
    langs: ['html']
  })

  try {
    const html = highlighter.codeToHtml('<a class="block:first-child"></a>', {
      lang: 'html',
      theme: 'distinct-pseudo',
      transformers: [transformerMasterCSS() as any]
    })
    expect(html).toMatch(/color:#222222[^>]*>first-child</i)
    expect(html).toMatch(/color:#111111[^>]*>:</i)
  } finally {
    await highlighter.dispose?.()
  }
})
