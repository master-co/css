import assert from 'node:assert/strict'
import { Linter } from 'eslint'
import masterCSS from '@master/eslint-config-css'
import { MasterCSSLanguageService } from '@master/css-language-service'
import { compileManifestSync } from '@master/css-compiler/node'
import { defaultClassLintSettings } from '@master/css-tooling/lint'
import { createToolingSessionSync } from '@master/css-tooling/node'
import createDoc from '../../packages/language-service/src/utils/create-doc'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import preset from '@master/internal-site/css/preset-manifest.ts'
import { toolingExample, toolingOptions } from '../utils/tooling-guide-data'
import { toolingGuideContent } from '../utils/tooling-content'
import { deliveryFences, deliverySource, siteRoot } from './delivery-examples'
import { packageEditorial } from '../reference/package-editorial'

export function verifyLintExamples() {
  const root = mkdtempSync(join(tmpdir(), 'master-doc-lint-'))
  const lint = new Linter({ cwd: root })
  const plugins = masterCSS.find(config => config.plugins)?.plugins
  const config = (rule: string, options?: object): Linter.Config[] => [{
    plugins,
    settings: { '@master/css': { manifest: preset } },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { [`@master/css/${rule}`]: options ? ['warn', options] : 'warn' }
  }]
  const html = (classes: string) => `<button class="${classes}">Save</button>`
  try {
    assert.equal(lint.verifyAndFix(html('p-md flex flex'), config('sort-classes')).output, html('flex p-md'))
    const decision = lint.verifyAndFix(html('(font-size:15px)'), config('no-unapproved-raw-values'))
    assert.equal(decision.fixed, false)
    assert.equal(decision.messages.length, 1)
    const source = deliverySource('code-linting')
    const section = (heading: string) => source.replace(/^(#{2,3} .+?)\s+\\?\{#[\w-]+\\?\}$/gm, '$1')
      .split(`### ${heading}\n`)[1].split(/\n## /)[0].split(/\n### /)[0]
    const invalid = deliveryFences(section('No invalid classes')).find(fence => fence.language === 'html')!
    const invalidMessages = lint.verify(invalid.text, config('no-invalid-classes'))
    assert.equal(invalidMessages.length, 1)
    assert.match(invalidMessages[0].message, /font-size:16.*invalid CSS/)
    assert.equal(lint.verifyAndFix(invalid.text, config('no-invalid-classes')).fixed, false)
    assert.deepEqual(lint.verify(html('font-md'), config('no-invalid-classes')), [])
    assert.deepEqual(lint.verify(html('(font-size:16px)'), config('no-invalid-classes')), [])
    assert.equal(lint.verify(html('btn'), config('no-invalid-classes', { disallowUnknownClass: true })).length, 1)
    assert.deepEqual(lint.verify(html('(margin:2.5rem)@sm (margin:3.125rem)@md'), config('no-conflicting-classes')), [])
    let pairsChecked = 0
    for (const [heading, rule] of [['Sort classes', 'sort-classes'], ['Prefer canonical classes', 'prefer-canonical-classes'], ['No conflicting classes', 'no-conflicting-classes']]) {
      for (const fence of deliveryFences(section(heading)).filter(fence => fence.language === 'mcss')) {
        const pairs = [...fence.text.matchAll(/([^\n]+) <!-- \[!code --\] -->\n([^\n]+) <!-- \[!code \+\+\] -->/g)]
        for (const [, before, after] of pairs) {
          assert.equal(lint.verifyAndFix(html(before), config(rule)).output, html(after), `${heading}: ${before}`)
          pairsChecked++
        }
      }
    }
    assert.equal(pairsChecked, 4, 'Every displayed before/after lint example is exercised')
    const upgrade = source.split('{#upgrade-pre-2-0-classes\\}')[1].split('\n## ')[0]
    const legacyPairs = deliveryFences(upgrade).filter(fence => fence.language === 'mcss')
      .flatMap(fence => [...fence.text.matchAll(/([^\n]+) <!-- \[!code --\] -->\n([^\n]+) <!-- \[!code \+\+\] -->/g)])
    assert.equal(legacyPairs.length, 1, 'The pre-2.0 upgrade example is exercised')
    for (const [, before, after] of legacyPairs) {
      assert.equal(lint.verifyAndFix(html(before), config('no-legacy-classes')).output, html(after), `Upgrade: ${before}`)
    }
    assert.equal(lint.verifyAndFix(html('p:8'), config('no-legacy-classes')).fixed, false)
    assert.equal(lint.verifyAndFix(html('(margin:1.25rem) (margin:0.625rem)'), config('no-conflicting-classes')).output, html('(margin:1.25rem)'))
    const partial = deliveryFences(section('No conflicting classes')).find(fence => fence.text.includes('bt-dashed'))!
    const partialResult = lint.verifyAndFix(html(partial.text.trim()), config('no-conflicting-classes'))
    assert.equal(partialResult.messages.length, 1)
    assert.equal(partialResult.fixed, false)
    const canonical = deliveryFences(section('Prefer canonical classes')).find(fence => fence.language === 'mcss')!
    assert.deepEqual(lint.verify(html(canonical.text.trim()), config('prefer-canonical-classes')), [])
    const raw = deliveryFences(source).find(fence => fence.language === 'mcss' && fence.text.includes('font-size:15px'))!
    const rawMessages = lint.verify(html(raw.text.trim()), config('no-unapproved-raw-values', {
      allowProperties: ['width', 'height'], allowedPatterns: ['^var\\(', '^calc\\(']
    }))
    assert.ok(rawMessages.some(message => message.message.includes('15px')))
    const recommended = Object.assign({}, ...masterCSS.map(item => item.rules))
    const documentedRules = Object.fromEntries([...packageEditorial['@master/eslint-config-css'].usage.matchAll(/\| `(@master\/css\/[^`]+)` \| `(warn|error)`/g)]
      .map(([, name, severity]) => [name, severity]))
    assert.deepEqual(documentedRules, recommended, 'Reference owns the complete recommended rule defaults')
    assert.deepEqual(defaultClassLintSettings.classAttributes, ['class', 'className'])
    assert.deepEqual(defaultClassLintSettings.ignoredKeys, ['compoundVariants', 'defaultVariants'])
    // ESLint arrays replace defaults; service arrays below extend them.
    const custom = config('sort-classes')
    custom[0].settings = { '@master/css': { manifest: preset, classFunctions: ['cn'] } }
    assert.equal(lint.verify("clsx('bg-white flex')", custom).length, 0)
    assert.equal(lint.verify("cn('bg-white flex')", custom).length, 1)
  } finally { rmSync(root, { recursive: true, force: true }) }
}

export async function verifyLanguageExamples() {
  // Exercise the article's project token, not just completion against the preset.
  const fences = deliveryFences(deliverySource('language-service'))
  const theme = fences.find(fence => fence.language === 'css' && fence.text.includes('--spacing-card'))!
  const markup = fences.find(fence => fence.language === 'html' && fence.text.includes('p-card'))!.text
  const compiled = compileManifestSync(theme.text.replace(/@import\s+'@master\/css';/, ''), { baseManifest: preset })
  assert.deepEqual(compiled.diagnostics.filter(item => item.severity === 'error'), [])
  const project = new MasterCSSLanguageService({}, { session: createToolingSessionSync({ manifest: compiled.manifest }) })
  try {
    const partial = markup.replace('p-card', 'p-ca')
    const document = createDoc('html', partial)
    const completions = project.suggestSyntax(document, document.positionAt(partial.indexOf('p-ca') + 4), { triggerKind: 1 })
    assert.ok(completions?.some(item => item.label === 'p-card'), 'The declared project token appears in completion')
    const accepted = createDoc('html', markup)
    const inspection = project.inspectSyntax(accepted, accepted.positionAt(markup.indexOf('p-card') + 3))
    assert.match((inspection?.contents as { value: string }).value, /padding:\s*var\(--spacing-card\)/)
  } finally { project.dispose() }
  const service = new MasterCSSLanguageService({ classFunctions: ['cn'], classAttributes: ['ui'] }, { session: createToolingSessionSync({ manifest: preset }) })
  try {
    const hover = toolingExample('hover')
    const doc = createDoc('html', hover.source)
    const output = service.inspectSyntax(doc, doc.positionAt(hover.source.indexOf('bg-') + 3))
    assert.ok((output?.contents as { value: string }).value.startsWith( `Named token: \`--color-blue-60\`\n\n\`\`\`css\n${hover.result}\n\`\`\``))
    const source = '<button class="p-">Save</button>'
    const completion = createDoc('html', source)
    const items = service.suggestSyntax(completion, completion.positionAt(source.indexOf('p-') + 2), { triggerKind: 2, triggerCharacter: '-' })
    for (const option of toolingOptions.completions.options) assert.equal(items?.find(item => item.label === option.name)?.detail, option.description)
    const format = toolingExample('format')
    const css = createDoc('css', format.source)
    const edits = service.formatDirectives(css) ?? []
    const formatted = [...edits].sort((a, b) => css.offsetAt(b.range.start) - css.offsetAt(a.range.start)).reduce((text, edit) => text.slice(0, css.offsetAt(edit.range.start)) + edit.newText + text.slice(css.offsetAt(edit.range.end)), format.source)
    assert.equal(formatted, format.result)
    assert.ok(service.settings.classFunctions?.includes('cn'))
    assert.ok(service.settings.classFunctions?.includes('clsx'))
    assert.ok(service.settings.classAttributes?.includes('ui'))
    assert.ok(service.settings.classAttributes?.includes('class'))
    const settings = JSON.parse(readFileSync(new URL('../../packages/vscode/package.json', import.meta.url), 'utf8')).contributes.configuration.properties
    for (const option of toolingOptions.languageSettings.options) assert.equal(String(settings[option.name].default), option.defaultValue)
    // Read the same authored DocumentOptionList that feeds the page and exports;
    // gallery fixtures alone cannot detect a missing or incorrect article default.
    const { markdown } = await toolingGuideContent(siteRoot, 'language-service')
    const documentedSettings = [...markdown.matchAll(/^\*\*`(masterCSS\.[^`]+)`\*\*\n\nDefault: ([^\n]+)$/gm)]
    assert.deepEqual(documentedSettings.map(([, name]) => name).sort(), Object.keys(settings).sort(), 'The Guide documents every extension setting exactly once')
    for (const [, name, value] of documentedSettings) {
      assert.ok(settings[name], `The extension defines ${name}`)
      const literal = /^`([^`]+)`\.$/.exec(value.trim())
      if (typeof settings[name].default !== 'object') {
        assert.ok(literal, `The Guide states the literal default for ${name}`)
        assert.equal(String(settings[name].default), literal[1], name)
      } else if (literal?.[1] === '[]') {
        assert.deepEqual(settings[name].default, [], name)
      }
    }
  } finally { service.dispose() }
}
