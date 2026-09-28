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
  for (const name of ['theme', 'utility', 'safelist', 'custom-variant']) {
    const pattern = findGrammarPattern(directive, pattern => pattern.begin === `(?i)(@)(${name})\\b`)
    expect(pattern.beginCaptures?.['0']?.name).toBe('keyword.control.at-rule.master-css')
  }
  const utility = findGrammarPattern(directive, pattern => pattern.begin?.includes('(utility)') === true)
  expectGrammarIncludes({ patterns: utility.patterns ?? [] }, ['#master-block', '#master-utility-prelude'])
  expect(MASTER_CSS_TEXTMATE_GRAMMAR.repository).not.toHaveProperty('master-compose-prelude')
  expect(MASTER_CSS_TEXTMATE_GRAMMAR.repository).not.toHaveProperty('master-theme-prelude')
  const classFragment = grammarEntry('master-class-fragment')
  findGrammarPattern(classFragment, pattern => pattern.name === 'keyword.control.at-rule.master-css.query')
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

    const code = "@theme {:root, :host { --color-primary: var(--value); }}\n"
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

    const code = "@theme { :root, :host {\n    --color-primary: var(--color-blue-60);\n} }\n\n@utility btn {\n        @safelist \"inline-flex fg-primary:hover@md\";\n    }\n@keyframes fade {\n    from { opacity: 0; }\n    to { opacity: 1; }\n}"
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
    const code = "@theme { .light {\n    /* Font families */\n    --tracking-tightest: -0.072em;\n} }\n"
    const result = highlighter.codeToTokens(code, {
      lang: 'css',
      theme: shikiSmokeTheme
    })

    expectTokensPreserveSource(result.tokens, code)
  } finally {
    await highlighter.dispose?.()
  }
})

