import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './helper'

describe.concurrent('pseudo-class', () => {
  test.concurrent(':', () => expect(hint("text-align:center:")?.map(({ label }) => label)).toContain(':active'))
  test.concurrent('two', () => expect(hint("text-align:center:hover:")?.map(({ label }) => label)).toContain(':active'))
  test.concurrent('utility', () => expect(hint("display:block:")?.map(({ label }) => label)).toContain(':active'))
  test.concurrent('functional labels', () => {
    const labels = hint("display:block:")?.map(({ label }) => label)

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
      ':state()',
      ':where()'
    ]))
    expect(labels).not.toEqual(expect.arrayContaining([
      ':nth()',
      ':nth-last()'
    ]))
  })
  it.concurrent('should take into account trigger character :', () => expect(hint("text-align:center:")?.find(({ label }) => label === ':active')).toMatchObject({ insertText: 'active' }))
  it.concurrent('should insert functional pseudo-class text without the trigger character', () => expect(hint("text-align:center:")?.find(({ label }) => label === ':not()')).toMatchObject({ insertText: 'not()' }))
  it.concurrent('should take into account trigger character +', () => expect(hint("text-align:center+")?.find(({ label }) => label === ':active')?.insertText).toBeUndefined())
  test.concurrent('info', () => expect(hint("display:block:")?.find(({ label }) => label === ':first')).toEqual({
    'detail': ':first-child',
    'documentation': {
      'kind': 'markdown',
      'value': dedent`
        \`\`\`css
        @layer utilities {
          .display\\:block\\:first:first-child {
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
  test.concurrent('::', () => expect(hint("text-align:center::")?.map(({ label }) => label)).toContain('::after'))
  test.concurrent('two', () => expect(hint("text-align:center::after::")?.map(({ label }) => label)).toContain('::after'))
  test.concurrent('utility', () => expect(hint("display:block::")?.map(({ label }) => label)).toContain('::after'))
  test.concurrent('removed aliases', () => {
    expect(hint("display:block::")?.map(({ label }) => label)).not.toEqual(expect.arrayContaining([
      '::scrollbar-corner',
      '::vt-new'
    ]))
  })
  it.concurrent('should take into account trigger character :', () => expect(hint("text-align:center:")?.find(({ label }) => label === '::after')).toMatchObject({ insertText: ':after' }))
  it.concurrent('should take into account trigger character ::', () => expect(hint("text-align:center::")?.find(({ label }) => label === '::after')).toMatchObject({ insertText: 'after' }))
  it.concurrent('should take into account trigger character +', () => expect(hint("text-align:center+")?.find(({ label }) => label === '::after')?.insertText).toBeUndefined())
  test.concurrent('info', () => expect(hint("display:block::")?.find(({ label }) => label === '::placeholder')).toEqual({
    'documentation': {
      'kind': 'markdown',
      'value': dedent`\`\`\`css
        @layer utilities {
          .display\\:block\\:\\:placeholder::placeholder {
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
  expect(hint("text-align:center:")?.length).toBeGreaterThan(100)
})

test('types _ should hint', () => {
  expect(hint("display:block_")?.map(({ label }) => label)).toContain(':active')
})

it('reserves native colon entries and suggests display states through an explicit declaration', () => {
  expect(hint("flex:")?.map(item => item.label)).not.toContain(':hover')
  expect(hint("grid:")?.map(item => item.label)).not.toContain(':hover')
  expect(hint('display:flex:')?.map(item => item.label)).toContain(':hover')
})
