import assert from 'node:assert/strict'
import { Linter } from 'eslint'
import masterCSS from '@master/eslint-config-css'
import { MasterCSSLanguageService } from '@master/css-language-service'
import { defaultClassLintSettings } from '@master/css-tooling/lint'
import { createToolingSessionSync } from '@master/css-tooling/node'
import createDoc from '../../packages/language-service/src/utils/create-doc'
import { mkdtempSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import preset from '../utils/preset-manifest'
import { toolingExample, toolingOptions } from '../utils/tooling-guide-data'
import { deliveryFences, deliverySource } from './delivery-examples'

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
    const source = deliverySource('code-linting')
    const section = (heading: string) => source.split(`### ${heading}\n`)[1].split(/\n## /)[0].split(/\n### /)[0]
    const invalid = deliveryFences(section('No invalid classes')).find(fence => fence.language === 'html')!
    const invalidMessages = lint.verify(invalid.text, config('no-invalid-classes'))
    assert.equal(invalidMessages.length, 1)
    assert.match(invalidMessages[0].message, /font-size:16.*invalid CSS/)
    assert.equal(lint.verifyAndFix(invalid.text, config('no-invalid-classes')).fixed, false)
    assert.deepEqual(lint.verify(html('font-md'), config('no-invalid-classes')), [])
    assert.deepEqual(lint.verify(html('font-size:16px'), config('no-invalid-classes')), [])
    assert.equal(lint.verify(html('btn'), config('no-invalid-classes', { disallowUnknownClass: true })).length, 1)
    assert.deepEqual(lint.verify(html('margin:2.5rem@sm margin:3.125rem@md'), config('no-conflicting-classes')), [])
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
    assert.equal(lint.verifyAndFix(html('margin:1.25rem margin:0.625rem'), config('no-conflicting-classes')).output, html('margin:1.25rem'))
    const partial = deliveryFences(section('No conflicting classes')).find(fence => fence.text.includes('border-style:solid'))!
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
    for (const [, name, severity] of source.matchAll(/\| `@master\/css\/([^`]+)` \| `(warn|error)`/g)) {
      assert.equal(recommended[`@master/css/${name}`], severity)
    }
    assert.deepEqual(defaultClassLintSettings.classAttributes, ['class', 'className'])
    assert.deepEqual(defaultClassLintSettings.ignoredKeys, ['compoundVariants', 'defaultVariants'])
    // ESLint arrays replace defaults; service arrays below extend them.
    const custom = config('sort-classes')
    custom[0].settings = { '@master/css': { manifest: preset, classFunctions: ['cn'] } }
    assert.equal(lint.verify("clsx('bg-white display:flex')", custom).length, 0)
    assert.equal(lint.verify("cn('bg-white display:flex')", custom).length, 1)
  } finally { rmSync(root, { recursive: true, force: true }) }
}

export function verifyLanguageExamples() {
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
  } finally { service.dispose() }
}
