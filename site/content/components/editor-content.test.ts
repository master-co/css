import assert from 'node:assert/strict'
import { test } from 'node:test'
import masterCSS from '@master/eslint-config-css'
import { MasterCSSLanguageService } from '@master/css-language-service'
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createToolingSessionSync } from '@master/css-tooling/node'
import Color from 'colorjs.io'
import { Linter } from 'eslint'
import preset from '../../utils/preset-manifest'
import { getColor, type ColorLevel } from '../../docs-shell/data/color-palette'
import { editorCompletion, editorCompletionDetail, editorCompletionLabels, editorHoverClass, editorSource, editorSwatches, filterCompletions } from './editor-content'
import { createEditorTextDocument, getEditorModel } from './editor-document'

const manifest = preset as unknown as MasterCSSManifest
const linter = new Linter({ configType: 'flat' })
const config: Linter.Config[] = [...masterCSS, {
  files: ['**/*.jsx'],
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  rules: { '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }] }
}]

/** The file before the completion is typed: the accepted class and the space before it are not there yet. */
const sourceBeforeCompletion = editorSource.split('\n').map((line, index) => index === editorCompletion.line ? line.replace(` ${editorCompletion.label}`, '') : line).join('\n')

function withService<T>(run: (service: MasterCSSLanguageService) => T) {
  const session = createToolingSessionSync({ manifest })
  try {
    return run(new MasterCSSLanguageService({ manifest }, { session }))
  } finally {
    session.dispose()
  }
}

test('the editor file is valid and sorted before and after the completion', () => {
  for (const source of [editorSource, sourceBeforeCompletion]) {
    const messages = linter.verify(`const sample = <>\n${source}\n</>`, config, { filename: 'home.jsx' })
    assert.deepEqual(messages.filter((message) => message.ruleId !== '@master/css/no-unapproved-raw-values'), [], source)
  }
})

test('the completion menu shows what the language service completes after the prefix', () => {
  const line = sourceBeforeCompletion.split('\n')[editorCompletion.line]
  const typed = `${editorCompletion.after} ${editorCompletion.prefix}`
  const text = line.replace(editorCompletion.after, typed)
  const document = createEditorTextDocument(text)
  const items = withService((service) => service.suggestSyntax(document as never, document.positionAt(text.indexOf(typed) + typed.length), { triggerKind: 2, triggerCharacter: '-' }) ?? [])
  assert.deepEqual(items.map((item) => item.label), [...editorCompletionLabels])
  assert.equal(items.find((item) => item.label === editorCompletion.label)?.detail, editorCompletionDetail)
})

test('typing narrows the list to the accepted completion', () => {
  const all = filterCompletions(editorCompletionLabels, editorCompletion.prefix, '')
  assert.deepEqual(all.map((item) => item.label), [...editorCompletionLabels])
  for (let length = 1; length <= editorCompletion.query.length; length++) {
    const items = filterCompletions(editorCompletionLabels, editorCompletion.prefix, editorCompletion.query.slice(0, length))
    assert.equal(items[0].label, editorCompletion.label)
    for (const item of items) assert.ok((editorCompletionLabels as readonly string[]).includes(item.label), item.label)
  }
  assert.deepEqual(filterCompletions(editorCompletionLabels, editorCompletion.prefix, editorCompletion.query).map((item) => item.label), [editorCompletion.label])
})

test('the editor swatches are the ones the language service renders', async () => {
  const document = createEditorTextDocument(editorSource)
  const colors = await withService((service) => service.renderSyntaxColors(document as never)) ?? []
  const lines = editorSource.split('\n')
  assert.deepEqual(colors.map((color) => {
    const { line, character } = color.range.start
    const swatch = editorSwatches.find((item) => lines[line].indexOf(item.className) + item.at === character)
    assert.ok(swatch, `a swatch at ${line}:${character}`)
    const expected = new Color('literal' in swatch ? swatch.literal : getColor(swatch.token[0], swatch.token[1] as ColorLevel)).to('srgb')
    assert.ok(expected.deltaE(new Color('srgb', [color.color.red, color.color.green, color.color.blue]), '2000') < 1, swatch.className)
    assert.equal(color.color.alpha, 'alpha' in swatch ? swatch.alpha : 1, swatch.className)
    return swatch.className
  }), editorSwatches.map((swatch) => swatch.className))
})

test('every class in the editor carries its semantic parts and the hover the language service shows', () => {
  const model = getEditorModel()
  for (const item of model.classes) {
    assert.equal(item.parts.map(([text]) => text).join(''), item.name)
    assert.equal(editorSource.split('\n')[item.line].slice(item.column, item.column + item.name.length), item.name)
    assert.match(model.hovers[item.hover].css, /@layer utilities \{/, item.name)
  }
  const hover = model.hovers[model.classes[model.hoverClass].hover]
  assert.equal(model.classes[model.hoverClass].name, editorHoverClass)
  assert.match(hover.css, /@media .*\{\n\s*\.fg-blue-70\\:hover\\@sm:hover \{/)
  assert.deepEqual(hover.tokens, ['--color-blue-70'])
  assert.equal(model.classes[model.insertion.classIndex].name, editorCompletion.label)
  assert.equal(model.classes[model.literalClass].swatch?.color, editorSwatches.find((swatch) => 'literal' in swatch)?.literal)
})
