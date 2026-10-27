import assert from 'node:assert/strict'
import { test } from 'node:test'
import masterCSS from '@master/eslint-config-css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { compileManifestSync } from '@master/css-compiler/node'
import { MasterCSSLanguageService } from '@master/css-language-service'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { Linter } from 'eslint'
import snapshot from '../../../benchmarks/docs-page-css-size/snapshot.json'
import { getHomePageCSSSize } from '../../utils/home-page-css-size'
import preset from '../../utils/preset-manifest'
import { activeSyntaxHighlightingCode, agentDiagnosticCards, heroExampleCode, manifestSuggestionItems, manifestSuggestionsPrefix, manifestSuggestionsTyped, nativeCssPrimitivesCode, themeVariablesCode } from './home-content'

const linter = new Linter({ configType: 'flat' })
const recommendedConfig: Linter.Config[] = [...masterCSS, {
  files: ['**/*.jsx'],
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }
}]
// Some diagnostic cards demonstrate opt-in policies.
const strictConfig: Linter.Config[] = [...recommendedConfig, {
  rules: {
    '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }],
    '@master/css/no-unapproved-raw-values': 'warn'
  }
}]

/** Lint an HTML sample as JSX, starting it on line 2 so its own lines and columns are kept. */
function lintSample(code: string, config = recommendedConfig) {
  const source = `const sample = <>\n${code.trim()}\n</>`
  return {
    messages: linter.verify(source, config, { filename: 'home.jsx' }),
    fixed: linter.verifyAndFix(source, config, { filename: 'home.jsx' }).output.slice('const sample = <>\n'.length, -'\n</>'.length)
  }
}

test('code diagnostic cards show what the lint rules report', () => {
  for (const card of agentDiagnosticCards) {
    if (!card.problem.source.startsWith('@master/css/')) continue
    const { messages, fixed } = lintSample(card.code, strictConfig)
    assert.deepEqual(messages.map((message) => ({
      location: `home.html:${message.line - 1}:${message.column}`,
      message: message.message,
      severity: message.severity === 2 ? 'error' : 'warning',
      source: message.ruleId
    })), [card.problem], card.title)
    assert.equal(fixed, (card.fixPreviewCode ?? card.code).trim(), card.title)
  }
})

test('the fix preview card previews the class order fix', () => {
  const classOrder = agentDiagnosticCards.find((card) => card.title === 'Class order')!
  const preview = agentDiagnosticCards.find((card) => card.title === 'Safe fix preview')!
  const [before] = classOrder.code.trim().split('\n')
  const [after] = classOrder.fixPreviewCode!.trim().split('\n')
  assert.deepEqual(preview.code.trim().split('\n').slice(0, 2), [`${before} <!-- [!code --] -->`, `${after} <!-- [!code ++] -->`])
})

test('homepage markup samples are valid and sorted', () => {
  for (const code of [heroExampleCode, activeSyntaxHighlightingCode]) {
    assert.deepEqual(lintSample(code).messages, [])
  }
})

test('homepage stylesheet samples compile without errors', () => {
  for (const source of [themeVariablesCode, nativeCssPrimitivesCode]) {
    const { diagnostics } = compileManifestSync(source, { baseManifest: preset })
    assert.deepEqual(diagnostics.filter((diagnostic) => diagnostic.severity === 'error'), [])
  }
})

test('manifest suggestions mirror the language service completions', () => {
  const manifest = defaultManifestJSON as unknown as MasterCSSManifest
  const service = new MasterCSSLanguageService({ manifest }, { session: createToolingSessionSync({ manifest }) })
  const before = '<button class="'
  const text = `${before}${manifestSuggestionsPrefix}">Upgrade plan</button>`
  const offset = before.length + manifestSuggestionsPrefix.length
  const document = {
    uri: 'file:///home.html',
    languageId: 'html',
    version: 1,
    lineCount: 1,
    getText: (range?: { start: { character: number }, end: { character: number } }) => range ? text.slice(range.start.character, range.end.character) : text,
    positionAt: (index: number) => ({ line: 0, character: index }),
    offsetAt: (position: { character: number }) => position.character
  }
  const items = service.suggestSyntax(document as never, document.positionAt(offset), { triggerKind: 2, triggerCharacter: '-' }) ?? []
  assert.deepEqual(items.slice(0, manifestSuggestionItems.length).map((item) => item.label), manifestSuggestionItems.map((item) => item.label))
  assert.ok(items[0].detail?.startsWith(manifestSuggestionItems[0].detail), items[0].detail)
  assert.equal(manifestSuggestionItems[0].label, manifestSuggestionsPrefix + manifestSuggestionsTyped)
})

test('homepage page CSS sizes come from the committed snapshot', () => {
  const masterCSSPage = snapshot.pages.find((page) => page.name === 'Master CSS')!
  for (const mode of getHomePageCSSSize()) {
    const kind = mode.id === 'raw' ? 'rawBytes' : 'brotliBytes'
    const expected = [...snapshot.pages].sort((a, b) => a.css.total[kind] - b.css.total[kind])
    assert.equal(mode.maxBytes, Math.max(...snapshot.pages.map((page) => page.css.total[kind])))
    assert.deepEqual(mode.rows, expected.map((page) => ({
      bytes: page.css.total[kind],
      isMasterCSS: page === masterCSSPage,
      name: page.name,
      ratio: Number((page.css.total[kind] / masterCSSPage.css.total[kind]).toFixed(1))
    })))
  }
})
