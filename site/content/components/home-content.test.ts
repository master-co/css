import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import masterCSS from '@master/eslint-config-css'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import { createRenderSessionSync } from '@master/css/node'
import { compileManifestSync } from '@master/css-compiler/node'
import { createToolingSessionSync } from '@master/css-tooling/node'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { Linter } from 'eslint'
import snapshot from '../../../benchmarks/docs-page-css-size/snapshot.json'
import { getHomePageCSSSize } from '../../utils/home-page-css-size'
import preset from '../../utils/preset-manifest'
import { fixMasterCSSContent, lintMasterCSSContent, resolveMasterCSSLintRules } from '@master/css-tooling/lint'
import { lintRuleReach } from './lint-content'
import { deliveryLateClass, deliveryMarkup, deliveryRenderedClasses } from './delivery-content'
// The Design system section checks its gallery classes, token values and cascade probe against the engine.
import './design-system-content.test'
// The AI agents section checks its MCP samples against the server source and the tooling lint.
import './agents-content.test'
// The Editor section checks its file, swatches, completions and hovers against the language service.
import './editor-content.test'
// The Workflow section checks its integrations, monorepo swatches, route samples and impact graph against the packages.
import './workflow-content.test'
import { agentSession, ctaClassRows, lintRules, cascadeLayers, themeVariablesCode } from './home-content'

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

test('lint rule samples show what the lint rules report', () => {
  for (const rule of lintRules) {
    if (!rule.problem.source.startsWith('@master/css/')) continue
    const { messages, fixed } = lintSample(rule.code, strictConfig)
    assert.deepEqual(messages.map((message) => ({
      location: `${rule.file}:${message.line - 1}:${message.column}`,
      message: message.message,
      severity: message.severity === 2 ? 'error' : 'warning',
      source: message.ruleId
    })), [rule.problem], rule.title)
    assert.equal(fixed, (rule.fixPreviewCode ?? rule.code).trim(), rule.title)
  }
})

test('lint rule marks point at what the rules report', () => {
  for (const rule of lintRules) {
    if (rule.mark) {
      const [, line, column] = rule.problem.location.split(':').map(Number)
      assert.equal(rule.code.trim().split('\n')[line - 1].indexOf(rule.mark) + 1, column, rule.title)
    }
  }
})

test('the fix preview rule previews the class order fix', () => {
  const classOrder = lintRules.find((rule) => rule.title === 'Class order')!
  const preview = lintRules.find((rule) => rule.title === 'Fix previews')!
  assert.equal(preview.file, classOrder.file)
  const [before] = classOrder.code.trim().split('\n')
  const [after] = classOrder.fixPreviewCode!.trim().split('\n')
  assert.deepEqual(preview.code.trim().split('\n').slice(0, 2), [`${before} <!-- [!code --] -->`, `${after} <!-- [!code ++] -->`])
})

test('the CLI and the MCP server report what ESLint reports for each lint rule', () => {
  const lintSession = createToolingSessionSync({ manifest: defaultManifestJSON as unknown as MasterCSSManifest })
  const lint = (code: string, file: string, rules?: string) => lintMasterCSSContent({ content: `${code.trim()}\n`, filePath: file, rules: resolveMasterCSSLintRules(rules), lintSession }).diagnostics
  try {
    for (const rule of lintRules) {
      const reach = lintRuleReach[rule.title]
      assert.ok(reach, rule.title)
      if (reach.eslintOption) {
        // An option only ESLint reads: the CLI and the MCP server name it instead of reporting.
        assert.equal(reach.cli ?? reach.mcp, undefined, rule.title)
        assert.deepEqual(lint(rule.code, rule.file, 'all'), [], rule.title)
        continue
      }
      if (reach.mcp === 'mastercss_preview_fixes') {
        // The preview is the class order fix, which `lint --fix` writes.
        const classOrder = lintRules.find((item) => item.title === 'Class order')!
        const content = `${classOrder.code.trim()}\n`
        assert.equal(fixMasterCSSContent({ content, filePath: classOrder.file, rules: resolveMasterCSSLintRules(reach.rules), lintSession }), `${classOrder.fixPreviewCode!.trim()}\n`)
        continue
      }
      assert.equal(reach.cli?.endsWith('--rules all'), reach.rules === 'all', rule.title)
      const [, line, column] = rule.problem.location.split(':').map(Number)
      assert.deepEqual(lint(rule.code, rule.file, reach.rules).map((diagnostic) => ({
        line: diagnostic.loc.start.line,
        column: diagnostic.loc.start.column,
        end: diagnostic.loc.end.column,
        severity: diagnostic.severity,
        message: diagnostic.message,
        source: `@master/css/${diagnostic.ruleId}`
      })), [{ line, column, end: column + rule.mark!.length, severity: rule.problem.severity, message: rule.problem.message, source: rule.problem.source }], rule.title)
    }
  } finally {
    lintSession.dispose()
  }
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

test('homepage markup samples are valid and sorted', () => {
  const samples = [
    [...deliveryMarkup.map((line) => `<${line.tag} class="${line.className}"></${line.tag}>`), `<li class="${deliveryLateClass}"></li>`].join('\n'),
    ...ctaClassRows.map((row) => row.map((className) => `<span class="${className}"></span>`).join('\n'))
  ]
  for (const code of samples) {
    assert.deepEqual(lintSample(code, strictConfig).messages.filter((message) => message.ruleId !== '@master/css/no-unapproved-raw-values'), [], code)
  }
})

test('the rendering stage generates a rule for every class, and the script adds one the markup lacks', () => {
  const engine = createRenderSessionSync({ manifest: preset })
  try {
    const { classRules, invalidClassNames } = engine.ensureClassRules([...deliveryRenderedClasses, deliveryLateClass])
    assert.deepEqual(invalidClassNames, [])
    for (const className of [...deliveryRenderedClasses, deliveryLateClass]) assert.equal(classRules[className].length, 1, className)
  } finally {
    engine.dispose()
  }
  assert.deepEqual(deliveryRenderedClasses, deliveryMarkup.flatMap((line) => line.className.split(' ')))
  assert.ok(!deliveryRenderedClasses.includes(deliveryLateClass))
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
