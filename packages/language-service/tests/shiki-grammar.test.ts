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

test.concurrent('defines deterministic TextMate grammar scopes for CSS directives', () => {
  expect(MASTER_CSS_TEXTMATE_GRAMMAR).toBe(sharedTextMateGrammar)
  expect(masterCSSShikiLanguage.scopeName).toBe(sharedTextMateGrammar.scopeName)
  expect(masterCSSShikiLanguage.injectTo).toEqual([
    'source.css',
    'source.css.scss',
    'source.css.less',
    'source.css.postcss'
  ])

  const directive = grammarEntry('master-directive')
  const themeDirective = findGrammarPattern(directive, (pattern) => pattern.begin === '(@)(theme)\\b')
  const managedDirective = findGrammarPattern(directive, (pattern) => pattern.begin === '(@)(defaults|components|utilities)\\b')
  const composeDirective = findGrammarPattern(directive, (pattern) => pattern.begin === '(@)(compose)\\b')

  expect(themeDirective.beginCaptures?.['0']?.name).toBe('keyword.control.at-rule.master-css')
  expect(managedDirective.beginCaptures?.['0']?.name).toBe('keyword.control.at-rule.master-css')
  expect(composeDirective.beginCaptures?.['0']?.name).toBe('keyword.control.at-rule.master-css')
  expect(directive.patterns.every((pattern) => pattern.beginCaptures?.['0']?.name === 'keyword.control.at-rule.master-css')).toBe(true)
  expectGrammarIncludes({ patterns: themeDirective.patterns ?? [] }, ['#master-theme-block', '#master-theme-prelude'])
  expectGrammarIncludes({ patterns: managedDirective.patterns ?? [] }, ['#master-managed-block'])
  expectGrammarIncludes({ patterns: composeDirective.patterns ?? [] }, ['#master-compose-prelude'])

  const themeBlock = grammarEntry('master-theme-block')
  expectGrammarIncludes({ patterns: themeBlock.patterns[0]?.patterns ?? [] }, [
    '#master-theme-declaration',
    '#master-keyframes',
    '#master-directive'
  ])

  const themeValue = grammarEntry('master-theme-value')
  expect(themeValue.patterns).not.toContainEqual(expect.objectContaining({
    match: '\\$[_a-zA-Z-][_a-zA-Z0-9-]*',
    name: 'variable.other.master-css'
  }))
  expect(JSON.stringify(themeValue)).not.toContain('--alpha')

  const composePrelude = grammarEntry('master-compose-prelude')
  expectGrammarIncludes(composePrelude, ['#master-string', '#master-query', '#master-selector', '#master-class-fragment'])

  const variantPrelude = grammarEntry('master-variant-prelude')
  findGrammarPattern(variantPrelude, (pattern) => pattern.name === 'support.constant.property-value.master-css.query')
  const query = grammarEntry('master-query')
  findGrammarPattern(query, (pattern) => pattern.name === 'keyword.control.at-rule.master-css.query')

  for (const block of ['master-block', 'master-managed-block']) {
    expectGrammarIncludes({ patterns: grammarEntry(block).patterns[0]?.patterns ?? [] }, ['source.css#at-rules'])
  }

  const classFragment = grammarEntry('master-class-fragment')
  findGrammarPattern(classFragment, (pattern) => pattern.name === 'support.constant.property-value.master-css')
  findGrammarPattern(classFragment, (pattern) => pattern.name === 'entity.other.attribute-name.class.master-css')
  findGrammarPattern(classFragment, (pattern) => pattern.name === 'keyword.control.at-rule.master-css.query')
  const propertyFragment = findGrammarPattern(classFragment, (pattern) => pattern.captures?.['1']?.name === 'support.type.property-name.master-css')
  expect(propertyFragment.captures?.['2']?.name).toBe('keyword.operator.master-css')
})

test('supports Shiki dynamic language imports', async () => {
  const masterCSSShikiLanguageImport = import('../src/shiki').then((module) => ({
    default: [module.masterCSSShikiLanguage]
  }))
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguageImport]
  })

  try {
    expect(highlighter.getLoadedLanguages()).toEqual(expect.arrayContaining(['css', masterCSSShikiLanguage.name]))

    const code = '@theme { --color-primary: var(--value); }'
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

    const code = [
      '@theme {',
      '    --color-primary: var(--color-blue-60);',
      '}',
      '@components {',
      '    btn {',
      '        @compose inline-flex fg-primary:hover@md;',
      '    }',
      '}',
      '@keyframes fade {',
      '    from { opacity: 0; }',
      '    to { opacity: 1; }',
      '}'
    ].join('\n')
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

test('keeps guide theme snippets correct with TextMate only', async () => {
  const highlighter = await createHighlighter({
    themes: [shikiSmokeTheme],
    langs: ['css', masterCSSShikiLanguage]
  })

  try {
    const code = [
      '@theme light {',
      '    /* Font families */',
      '    --tracking-tightest: -0.072em;',
      '}'
    ].join('\n')
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

