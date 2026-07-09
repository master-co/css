import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './helper'

describe.concurrent('pseudo-class', () => {
  test.concurrent(':', () => expect(hint('text-center:')?.map(({ label }) => label)).toContain(':active'))
  test.concurrent('two', () => expect(hint('text-center:hover:')?.map(({ label }) => label)).toContain(':active'))
  test.concurrent('utility', () => expect(hint('block:')?.map(({ label }) => label)).toContain(':active'))
  test.concurrent('functional labels', () => {
    const labels = hint('block:')?.map(({ label }) => label)

    expect(labels).toEqual(expect.arrayContaining([
      ':current()',
      ':dir()',
      ':has()',
      ':has-slotted()',
      ':host()',
      ':host-context()',
      ':is()',
      ':lang()',
      ':local-link()',
      ':not()',
      ':nth-child()',
      ':nth-last-child()',
      ':nth-last-of-type()',
      ':nth-of-type()',
      ':of()',
      ':state()',
      ':where()'
    ]))
    expect(labels).not.toEqual(expect.arrayContaining([
      ':nth()',
      ':nth-last()'
    ]))
  })
  it.concurrent('should take into account trigger character :', () => expect(hint('text-center:')?.find(({ label }) => label === ':active')).toMatchObject({ insertText: 'active' }))
  it.concurrent('should insert functional pseudo-class text without the trigger character', () => expect(hint('text-center:')?.find(({ label }) => label === ':not()')).toMatchObject({ insertText: 'not()' }))
  it.concurrent('should take into account trigger character +', () => expect(hint('text-center+')?.find(({ label }) => label === ':active')?.insertText).toBeUndefined())
  test.concurrent('info', () => expect(hint('block:')?.find(({ label }) => label === ':first')).toEqual({
    'detail': ':first-child',
    'documentation': {
      'kind': 'markdown',
      'value': dedent`
        \`\`\`css
        @layer utilities {
          .block\\:first:first-child {
            display: block
          }
        }
        \`\`\`
      `,
    },
    'insertText': 'first',
    'kind': 3,
    'label': ':first',
    'sortText': 'yyfirst',
  }))
})

describe.concurrent('pseudo-element', () => {
  test.concurrent('::', () => expect(hint('text-center::')?.map(({ label }) => label)).toContain('::after'))
  test.concurrent('two', () => expect(hint('text-center::after::')?.map(({ label }) => label)).toContain('::after'))
  test.concurrent('utility', () => expect(hint('block::')?.map(({ label }) => label)).toContain('::after'))
  test.concurrent('removed aliases', () => {
    expect(hint('block::')?.map(({ label }) => label)).not.toEqual(expect.arrayContaining([
      '::scrollbar-corner',
      '::vt-new'
    ]))
  })
  it.concurrent('should take into account trigger character :', () => expect(hint('text-center:')?.find(({ label }) => label === '::after')).toMatchObject({ insertText: ':after' }))
  it.concurrent('should take into account trigger character ::', () => expect(hint('text-center::')?.find(({ label }) => label === '::after')).toMatchObject({ insertText: 'after' }))
  it.concurrent('should take into account trigger character +', () => expect(hint('text-center+')?.find(({ label }) => label === '::after')?.insertText).toBeUndefined())
  test.concurrent('info', () => expect(hint('block::')?.find(({ label }) => label === '::placeholder')).toEqual({
    'documentation': {
      'kind': 'markdown',
      'value': dedent`\`\`\`css
        @layer utilities {
          .block\\:\\:placeholder::placeholder {
            display: block
          }
        }
        \`\`\`
     `,
    },
    'insertText': 'placeholder',
    'kind': 3,
    'label': '::placeholder',
    'sortText': 'zzplaceholder',
  }))
})

test.concurrent('sorting', () => {
  expect(hint('text-center:')?.length).toBeGreaterThan(100)
})

test.todo('types _ should hint')
