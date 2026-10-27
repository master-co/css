import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import masterCSS from '@master/eslint-config-css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { compileManifestSync } from '@master/css-compiler/node'
import { MasterCSSLanguageService } from '@master/css-language-service'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import Color from 'colorjs.io'
import { Linter } from 'eslint'
import snapshot from '../../../benchmarks/docs-page-css-size/snapshot.json'
import { getHomePageCSSSize } from '../../utils/home-page-css-size'
import preset from '../../utils/preset-manifest'
import { activeSyntaxHighlightingCode, agentDiagnosticCards, agentSession, colorToolClasses, ctaClassRows, deliveryFlowPackets, deliveryFlowSources, heroComposerProblem, heroComposerSortedTokens, heroComposerTokens, hoverInspectionLines, manifestSuggestionItems, manifestSuggestionsPrefix, manifestSuggestionsTyped, cascadeLayers, themeVariablesCode } from './home-content'

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

/** A one-line text document for the language service. */
function createDocument(text: string) {
  return {
    uri: 'file:///home.html',
    languageId: 'html',
    version: 1,
    lineCount: 1,
    getText: (range?: { start: { character: number }, end: { character: number } }) => range ? text.slice(range.start.character, range.end.character) : text,
    positionAt: (index: number) => ({ line: 0, character: index }),
    offsetAt: (position: { character: number }) => position.character
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

test('the agent session shows what the lint rules report and fix', () => {
  const { messages, fixed } = lintSample(agentSession.code)
  assert.deepEqual(messages.map((message) => ({
    location: `${agentSession.file}:${message.line - 1}:${message.column}`,
    message: message.message,
    severity: message.severity === 2 ? 'error' : 'warning',
    source: message.ruleId
  })), agentSession.problems)
  assert.equal(fixed, agentSession.fixedCode.trim())
})

test('the hero composer types unsorted classes that the class order fix sorts', () => {
  const { messages, fixed } = lintSample(`<button class="${heroComposerTokens.join(' ')}">Upgrade</button>`)
  assert.deepEqual(messages.map((message) => message.message), [heroComposerProblem])
  assert.equal(fixed, `<button class="${heroComposerSortedTokens.join(' ')}">Upgrade</button>`)
})

test('homepage markup samples are valid and sorted', () => {
  const samples = [
    activeSyntaxHighlightingCode,
    hoverInspectionLines.join('\n'),
    colorToolClasses.map((item) => `<span class="${item.className}"></span>`).join('\n'),
    deliveryFlowSources.map((source) => `<span ${source.code}></span>`).join('\n'),
    ...ctaClassRows.map((row) => row.map((className) => `<span class="${className}"></span>`).join('\n'))
  ]
  for (const code of samples) {
    assert.deepEqual(lintSample(code, strictConfig).messages.filter((message) => message.ruleId !== '@master/css/no-unapproved-raw-values'), [], code)
  }
})

test('the delivery diagram carries the classes its sources declare', () => {
  assert.deepEqual(deliveryFlowSources.flatMap((source) => source.code.match(/"([^"]*)"/)![1].split(' ')), [...deliveryFlowPackets])
})

test('homepage stylesheet samples compile without errors', () => {
  for (const source of [themeVariablesCode]) {
    const { diagnostics } = compileManifestSync(source, { baseManifest: preset })
    assert.deepEqual(diagnostics.filter((diagnostic) => diagnostic.severity === 'error'), [])
  }
})

test('the cascade layer figure follows the preset layer order', () => {
  const base = readFileSync(new URL('../../../packages/preset/src/base.css', import.meta.url), 'utf8')
  assert.equal(base.match(/@layer ([^;{]+);/)?.[1], cascadeLayers.map((layer) => layer.name).join(', '))
})

test('color tool swatches are the ones the language service renders', async () => {
  const manifest = defaultManifestJSON as unknown as MasterCSSManifest
  const service = new MasterCSSLanguageService({ manifest }, { session: createToolingSessionSync({ manifest }) })
  const before = '<span class="'
  for (const item of colorToolClasses) {
    const text = `${before}${item.className}"></span>`
    const document = createDocument(text)
    const [swatch, ...rest] = await service.renderSyntaxColors(document as never) ?? []
    assert.equal(rest.length, 0, item.className)
    assert.equal(swatch?.range.start.character, before.length + item.swatchAt, item.className)
    const expected = new Color(item.color).to('srgb')
    assert.ok(expected.deltaE(new Color('srgb', [swatch.color.red, swatch.color.green, swatch.color.blue]), '2000') < 1, item.className)
  }
})

test('manifest suggestions mirror the language service completions', () => {
  const manifest = defaultManifestJSON as unknown as MasterCSSManifest
  const service = new MasterCSSLanguageService({ manifest }, { session: createToolingSessionSync({ manifest }) })
  const before = '<button class="'
  const text = `${before}${manifestSuggestionsPrefix}">Upgrade plan</button>`
  const offset = before.length + manifestSuggestionsPrefix.length
  const document = createDocument(text)
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
