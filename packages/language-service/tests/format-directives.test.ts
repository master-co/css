import { expect, test } from 'vitest'
import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import type { TextEdit } from 'vscode-languageserver-protocol'

function applyTextEdits(source: string, edits: TextEdit[], doc = createDoc('css', source)) {
  return [...edits]
    .sort((a, b) => doc.offsetAt(b.range.start) - doc.offsetAt(a.range.start))
    .reduce((result, edit) => {
      const start = doc.offsetAt(edit.range.start)
      const end = doc.offsetAt(edit.range.end)
      return result.slice(0, start) + edit.newText + result.slice(end)
    }, source)
}

function format(ext: Parameters<typeof createDoc>[0], source: string, settings?: ConstructorParameters<typeof CSSLanguageService>[0]) {
  const doc = createDoc(ext, source)
  const languageService = new CSSLanguageService(settings)
  return applyTextEdits(source, languageService.formatDirectives(doc) ?? [], doc)
}

test.concurrent('formats CSS @compose important markers', () => {
  expect(format('css', '.btn { @compose bg:transparent ! fg:red !@sm; }'))
    .toBe('.btn { @compose bg:transparent! fg:red!@sm; }')
})

test.concurrent('formats SCSS and LESS directive class lists', () => {
  expect(format('scss', '.btn { @compose bg:transparent !; }')).toBe('.btn { @compose bg:transparent!; }')
  expect(format('less', '.btn { @compose bg:transparent !; }')).toBe('.btn { @compose bg:transparent!; }')
})

test.concurrent('formats CSS-family SFC style blocks only', () => {
  const source = [
    '<template><div class="bg:red !"></div></template>',
    '<style>',
    '.btn { @compose bg:transparent !; }',
    '</style>',
    '<style lang="postcss">',
    '.postcss { @compose bg:red !; }',
    '</style>',
    '<style lang="scss">',
    '.card { @compose fg:red !@sm; }',
    '</style>'
  ].join('\n')
  expect(format('vue', source)).toBe([
    '<template><div class="bg:red !"></div></template>',
    '<style>',
    '.btn { @compose bg:transparent!; }',
    '</style>',
    '<style lang="postcss">',
    '.postcss { @compose bg:red !; }',
    '</style>',
    '<style lang="scss">',
    '.card { @compose fg:red!@sm; }',
    '</style>'
  ].join('\n'))
})

test.concurrent('formats safelist quoted class lists', () => {
  expect(format('css', '@safelist "bg:transparent !  fg:red !@sm";'))
    .toBe('@safelist "bg:transparent! fg:red!@sm";')
})

test.concurrent('returns no edits when directive formatting is disabled', () => {
  expect(format('css', '.btn { @compose bg:transparent !; }', { formatDirectives: false }))
    .toBe('.btn { @compose bg:transparent !; }')
})

test.concurrent('respects range formatting', () => {
  const source = '.a { @compose bg:red !; }\n.b { @compose bg:blue !; }'
  const doc = createDoc('css', source)
  const languageService = new CSSLanguageService()
  const start = doc.positionAt(source.indexOf('@compose bg:blue'))
  const edits = languageService.formatDirectives(doc, {
    start,
    end: doc.positionAt(source.length)
  }) ?? []
  expect(applyTextEdits(source, edits, doc)).toBe('.a { @compose bg:red !; }\n.b { @compose bg:blue!; }')
})
