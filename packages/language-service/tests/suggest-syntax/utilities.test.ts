import { expect, test } from 'vitest'
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver-protocol'
import { hint } from './helper'

test('offers mixins and named tokens while removing fixed aliases', () => {
  const roots = hint('')?.map(({ label }) => label)
  expect(roots).toEqual(expect.arrayContaining(['sr-only', 'font-sm', 'text-sm', 'p-md', 'display:']))
  expect(roots).not.toEqual(expect.arrayContaining(['block', 'hidden', 'abs', 'p:', 'text:', 'fit', 'full', 'center', 'middle', 'round']))
  expect(hint('font-s')?.map(({ label }) => label)).toContain('font-sm')
  expect(hint('m-m')?.map(({ label }) => label)).toContain('m-md')
})

test.each([
  ['position:', 'absolute'], ['text-align:', 'center'], ['background-size:', 'cover'],
  ['object-fit:', 'cover'], ['border-style:', 'dashed'], ['border-left-style:', 'solid'],
  ['outline-width:', 'thin']
])('offers native values for %s', (property, value) => {
  expect(hint(property)?.map(({ label }) => label)).toContain(value)
})

test('parameter mixin completion inserts a snippet and describes its parameter', () => {
  expect(hint('grid-cols')?.find(({ label }) => label === 'grid-cols()')).toMatchObject({
    kind: CompletionItemKind.Function,
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: expect.stringContaining('${1:'),
    detail: expect.stringContaining('integer')
  })
  expect(hint('grid-cols(3)_')?.map(({ label }) => label)).toContain(':hover')
})

test('zero-argument mixin completion documents its generated CSS', () => {
  expect(hint('sr-on')?.find(({ label }) => label === 'sr-only')).toMatchObject({
    detail: 'mixin',
    documentation: { kind: 'markdown', value: expect.stringContaining('position: absolute') }
  })
})
