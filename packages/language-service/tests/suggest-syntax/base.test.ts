import { expect, it, test } from 'vitest'
import { hint } from './helper'
import CSSLanguageService from '../helpers/rc87-language-service'
import createDoc from '../../src/utils/create-doc'

function suggestInSource(source: string, marker: string) {
  const document = createDoc('js', source)
  const position = source.indexOf(marker) + marker.length
  return new CSSLanguageService().suggestSyntax(document, document.positionAt(position), {
    triggerKind: 2,
    triggerCharacter: marker.at(-1)
  })
}

it.concurrent('types " should hint completions', () => expect(hint('')?.length).toBeGreaterThan(0))
it.concurrent('types   should hint completions', () => expect(hint('text-center ')?.length).toBeGreaterThan(0))
it.concurrent('types dynamic enum key should hint enum values', () => {
  expect(hint('user-select:')?.some(({ label }) => label === 'none')).toBe(true)
  expect(hint('line-clamp:')?.some(({ label }) => label === 'none')).toBe(true)
})

test('types any trigger character in "" should not hint', () => {
  expect(suggestInSource('const value = "text:c"', 'text:c')).toBeUndefined()
})

test(`types any trigger character in '' should not hint`, () => {
  expect(suggestInSource("const value = 'text:c'", 'text:c')).toBeUndefined()
})

test('emit class="" should hint completions', () => {
  expect(hint('')?.length).toBeGreaterThan(0)
})
