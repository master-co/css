import assert from 'node:assert/strict'
import { Linter } from 'eslint'
import masterCSS from '@master/eslint-config-css'
import { MasterCSSLanguageService } from '@master/css-language-service'
import { defaultCanonicalClassNameOptions, defaultClassLintSettings } from '@master/css-tooling/lint'
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
    for (const [name, rule] of [['sort', 'sort-classes'], ['canonical', 'prefer-canonical-classes'], ['conflict', 'no-conflicting-classes'], ['invalid', 'no-invalid-classes'], ['raw', 'no-unapproved-raw-values']]) {
      const example = toolingExample(name)
      const source = example.language === 'html' ? example.source : html(example.source)
      const messages = lint.verify(source, config(rule))
      assert.ok(messages.length > 0, `${name}: actual rule diagnostic`)
      if (example.diagnostic) assert.equal(messages[0].message, example.diagnostic.message)
      const fixed = lint.verifyAndFix(source, config(rule))
      if (example.result !== undefined) {
        assert.equal(fixed.output, html(example.result))
        assert.deepEqual(fixed.messages, [])
      } else assert.equal(fixed.fixed, false)
    }
    assert.deepEqual(lint.verify(html('font:'), config('no-invalid-classes')), [])
    assert.equal(lint.verify(html('btn'), config('no-invalid-classes', { disallowUnknownClass: true })).length, 1)
    assert.deepEqual(lint.verify(html('m-sm@sm m-lg@md'), config('no-conflicting-classes')), [])
    // The authored short diffs also use each section's actual rule.
    const source = deliverySource('code-linting')
    for (const [heading, rule] of [['Sort classes', 'sort-classes'], ['Prefer canonical classes', 'prefer-canonical-classes'], ['No conflicting classes', 'no-conflicting-classes']]) {
      const section = source.split(`### ${heading}\n`)[1].split(/\n## /)[0].split(/\n### /)[0]
      for (const fence of deliveryFences(section).filter(f => f.language === 'mcss')) {
        const pairs = [...fence.text.matchAll(/([^\n]+) <!-- \[!code --\] -->\n([^\n]+) <!-- \[!code \+\+\] -->/g)]
        for (const [, before, after] of pairs) assert.equal(lint.verifyAndFix(html(before), config(rule)).output, html(after))
      }
    }
    const compose = deliveryFences(source).find(f => f.name === 'button.css')!.text
    const variant = (exclude: string) => compose.split('\n').filter(line => !line.includes(`[!code ${exclude}]`)).map(line => line.replace(/ \/\* \[!code (?:--|\+\+)\] \*\//, '')).join('\n')
    const cssConfig = [...masterCSS, { settings: { '@master/css': { manifest: preset } } }]
    assert.equal(lint.verifyAndFix(variant('++'), cssConfig, { filename: 'button.css' }).output, variant('--'))
    for (const option of toolingOptions.canonical.options) assert.equal(String(defaultCanonicalClassNameOptions[option.name as keyof typeof defaultCanonicalClassNameOptions]), option.defaultValue)
    for (const option of toolingOptions.rules.options) assert.equal(masterCSS[0].rules?.[`@master/css/${option.name}`], option.defaultValue.split(' · ')[0])
    assert.deepEqual(defaultClassLintSettings.classAttributes, ['class', 'className'])
    assert.deepEqual(defaultClassLintSettings.ignoredKeys, ['compoundVariants', 'defaultVariants'])
    assert.deepEqual(defaultClassLintSettings.classFunctions.slice(0, 7), ['clsx', 'cva', 'ctl', 'cv', 'class', 'classnames', 'classVariant'])
    // ESLint arrays replace defaults; service arrays below extend them.
    const custom = config('sort-classes')
    custom[0].settings = { '@master/css': { manifest: preset, classFunctions: ['cn'] } }
    assert.equal(lint.verify("clsx('p-md flex')", custom).length, 0)
    assert.equal(lint.verify("cn('p-md flex')", custom).length, 1)
  } finally { rmSync(root, { recursive: true, force: true }) }
}

export function verifyLanguageExamples() {
  const service = new MasterCSSLanguageService({ classFunctions: ['cn'], classAttributes: ['ui'] }, { session: createToolingSessionSync({ manifest: preset }) })
  try {
    const hover = toolingExample('hover')
    const doc = createDoc('html', hover.source)
    const output = service.inspectSyntax(doc, doc.positionAt(hover.source.indexOf('bg-') + 3))
    assert.equal((output?.contents as { value: string }).value, `Named token: \`--color-blue-60\`\n\n\`\`\`css\n${hover.result}\n\`\`\``)
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
