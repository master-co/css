import { expect, test } from 'vitest'
import CSSLanguageService from './helpers/rc87-language-service'
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

test.concurrent('formats CSS @safelist important markers', () => {
  expect(format('css', ".btn { @safelist \"background-color:transparent ! fg-red !@sm\"; }"))
    .toBe(".btn { @safelist \"background-color:transparent! fg-red!@sm\"; }")
})

test.concurrent('formats SCSS and LESS directive class lists', () => {
  expect(format('scss', ".btn { @safelist \"background-color:transparent !\"; }")).toBe(".btn { @safelist \"background-color:transparent!\"; }")
  expect(format('less', ".btn { @safelist \"background-color:transparent !\"; }")).toBe(".btn { @safelist \"background-color:transparent!\"; }")
})

test.concurrent('formats CSS-family SFC style blocks only', () => {
  const source = [
    '<template><div class="bg-red !"></div></template>',
    '<style>',
    ".btn { @safelist \"background-color:transparent !\"; }",
    '</style>',
    '<style lang="postcss">',
    ".postcss { @safelist \"bg-red !\"; }",
    '</style>',
    '<style lang="scss">',
    ".card { @safelist \"fg-red !@sm\"; }",
    '</style>'
  ].join('\n')
  expect(format('vue', source)).toBe([
    '<template><div class="bg-red !"></div></template>',
    '<style>',
    ".btn { @safelist \"background-color:transparent!\"; }",
    '</style>',
    '<style lang="postcss">',
    ".postcss { @safelist \"bg-red !\"; }",
    '</style>',
    '<style lang="scss">',
    ".card { @safelist \"fg-red!@sm\"; }",
    '</style>'
  ].join('\n'))
})

test.concurrent('locates SFC style content after matching attribute text', () => {
  const directive = ".btn { @safelist \"background-color:transparent !\"; }"
  const source = `<style data-source='${directive}'>${directive}</style>`
  expect(format('vue', source))
    .toBe(`<style data-source='${directive}'>.btn { @safelist "background-color:transparent!"; }</style>`)
})

test.concurrent('formats safelist quoted class lists', () => {
  expect(format('css', '@safelist "background-color:transparent !  fg-red !@sm";'))
    .toBe('@safelist "background-color:transparent! fg-red!@sm";')
})

test.concurrent('returns no edits when directive formatting is disabled', () => {
  expect(format('css', ".btn { @safelist \"background-color:transparent !\"; }", { formatDirectives: false }))
    .toBe(".btn { @safelist \"background-color:transparent !\"; }")
})

test.concurrent('respects range formatting', () => {
  const source = ".a { @safelist \"bg-red !\"; }\n.b { @safelist \"bg-blue !\"; }"
  const doc = createDoc('css', source)
  const languageService = new CSSLanguageService()
  const start = doc.positionAt(source.indexOf('@safelist "bg-blue'))
  const edits = languageService.formatDirectives(doc, {
    start,
    end: doc.positionAt(source.length)
  }) ?? []
  expect(applyTextEdits(source, edits, doc)).toBe(".a { @safelist \"bg-red !\"; }\n.b { @safelist \"bg-blue!\"; }")
})
