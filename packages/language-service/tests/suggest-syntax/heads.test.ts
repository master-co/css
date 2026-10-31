import { describe, expect, test } from 'vitest'
import { InsertTextFormat, type CompletionItem } from 'vscode-languageserver-protocol'
import CSSLanguageService from '../helpers/language-service'
import createDoc from '../../src/utils/create-doc'

const languageService = new CSSLanguageService()

/** Completes `before|after` inside an HTML class attribute that follows `prefix`. */
function complete(before: string, after = '', prefix = '<div class="') {
  const content = `${prefix}${before}${after}"></div>`
  const document = createDoc('html', content)
  const offset = prefix.length + before.length
  const items = languageService.suggestSyntax(document, document.positionAt(offset), { triggerKind: 1 }) ?? []
  return {
    items,
    find: (label: string) => items.find(item => item.label === label) as CompletionItem,
    range: (start: number, end = offset) => ({ start: document.positionAt(start), end: document.positionAt(end) })
  }
}

describe('declaration head roots', () => {
  test('completes a typed head to its property', () => {
    const { find, range } = complete('(disp')
    expect(find('(display:')).toMatchObject({
      filterText: '(display:',
      textEdit: { range: range('<div class="'.length), newText: '(display:' }
    })
    expect(find('(display:').insertText).toBeUndefined()
  })

  test('matches a bare property name and replaces it from the class start', () => {
    const { find, range } = complete('disp')
    expect(find('(display:')).toMatchObject({
      filterText: 'display:',
      textEdit: { range: range('<div class="'.length), newText: '(display:' }
    })
  })

  test('keeps parameter snippets of functional utilities', () => {
    const { find } = complete('grid-co')
    expect(find('grid-cols()')).toMatchObject({
      insertTextFormat: InsertTextFormat.Snippet,
      textEdit: { newText: 'grid-cols(${1:1})$0' }
    })
  })
})

describe('declaration head values', () => {
  test('replaces the typed value and closes the head', () => {
    const { find, range } = complete('(display:bl')
    const start = '<div class="(display:'.length
    expect(find('block')).toMatchObject({
      filterText: 'block',
      detail: 'display: block',
      textEdit: { range: range(start), newText: 'block)' }
    })
    expect(find('block').insertText).toBeUndefined()
  })

  test('measures ranges in UTF-16 code units after a multi-byte character', () => {
    const prefix = '<div title="😀 é" class="'
    const { find, range } = complete('(display:bl', '', prefix)
    const start = prefix.length + '(display:'.length
    expect(find('block').textEdit).toEqual({ range: range(start), newText: 'block)' })
    // LSP characters count UTF-16 code units: the emoji spans two of them.
    expect(find('block').textEdit).toMatchObject({ range: { start: { line: 0, character: 34 }, end: { line: 0, character: 36 } } })
  })

  test('does not repeat an existing closing parenthesis', () => {
    const { find, range } = complete('(display:bl', ')')
    expect(find('block').textEdit).toEqual({ range: range('<div class="(display:'.length), newText: 'block' })
    expect(complete('(display:bl', '):hover').find('block').textEdit?.newText).toBe('block')
  })

  test('places the snippet cursor inside a function value', () => {
    const { find } = complete('(color:')
    expect(find('rgb()')).toMatchObject({ insertTextFormat: InsertTextFormat.Snippet, textEdit: { newText: 'rgb($0))' } })
    expect(complete('(color:', ')').find('rgb()').textEdit?.newText).toBe('rgb($0)')
  })

  test('replaces only the component after a space or comma delimiter', () => {
    const border = complete('(border:1px|so')
    expect(border.find('solid').textEdit).toEqual({ range: border.range('<div class="(border:1px|'.length), newText: 'solid)' })
    const shadow = complete('(box-shadow:1px|1px|2px|black,')
    expect(shadow.find('inset').textEdit).toEqual({ range: shadow.range('<div class="(box-shadow:1px|1px|2px|black,'.length), newText: 'inset)' })
  })

  test('offers no values once the head is complete', () => {
    expect(complete('(display:block)').items).toEqual([])
  })

  test('replaces the whole component around the cursor', () => {
    const apply = (before: string, after: string, label: string) => {
      const { find } = complete(before, after)
      const { range, newText } = find(label).textEdit as { range: { start: { character: number }, end: { character: number } }, newText: string }
      const content = `<div class="${before}${after}"></div>`
      return content.slice(0, range.start.character) + newText + content.slice(range.end.character)
    }
    expect(apply('(display:bl', 'ock):hover', 'block')).toBe('<div class="(display:block):hover"></div>')
    expect(apply('(display:inl', 'ine-blo', 'inline-block')).toBe('<div class="(display:inline-block)"></div>')
    expect(apply('(border:1px|so', 'lid|red)', 'dashed')).toBe('<div class="(border:1px|dashed|red)"></div>')
    expect(apply('(disp', 'lay:block)', '(display:')).toBe('<div class="(display:block)"></div>')
  })

  test('offers nothing inside strings, comments, URLs or nested functions', () => {
    expect(complete("(content:'a|b", "c')").items).toEqual([])
    expect(complete('(width:calc(1px+', '2px))').items).toEqual([])
    expect(complete('(background:url(https://a.test/', 'b.png))').items).toEqual([])
    expect(complete('(color:red/*a', '*/)').items).toEqual([])
  })
})
