import { test, it, expect, describe } from 'vitest'
import CSSLanguageService from './helpers/rc87-language-service'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'
import { Position } from 'vscode-languageserver-textdocument'
import dedent from 'ts-dedent'
import type { Settings } from './helpers/rc87-language-service'

export const inspect = (target: string, settings: Settings = {}) => {
  const content = `export default () => <div className='${target}'></div>`
  const doc = createDoc('tsx', content)
  const range = getRange(target, doc)
  const languageService = new CSSLanguageService(settings)
  return languageService.inspectSyntax(doc, range?.start as Position)
}

test.concurrent("text-align:center", async () => {
  const target = "text-align:center"
  const hover = inspect(target)
  expect(hover?.contents).toEqual({
    'kind': 'markdown',
    'value': dedent`
      \`\`\`css
      @layer utilities {
        .text-align\\:center {
          text-align: center
        }
      }
      \`\`\`
    `
  })
})

test.concurrent("display:none", async () => {
  const target = "display:none"
  const hover = inspect(target)
  expect(hover?.contents).toEqual({
    'kind': 'markdown',
    'value': dedent`
      \`\`\`css
      @layer utilities {
        .display\\:none {
          display: none
        }
      }
      \`\`\`
    `
  })
})

test.concurrent('vendor-prefixed native declarations use unprefixed MDN hover syntax', () => {
  for (const property of ['-webkit-text-size-adjust', '-moz-text-size-adjust', '-ms-text-size-adjust']) {
    const hover = inspect(property + ':none')
    const contents = hover?.contents as { value?: string } | undefined

    expect(contents?.value).toContain(`${property}: none`)
    expect(contents?.value).toContain(`.${property}\\:none`)
  }
})


test.each(['{color:red;display:block}', 'color:red:of(.active)', 'color:red:is(:of(.active))'])('does not offer CSS hover for a retired class: %s', (target) => {
  const hover = inspect(target)
  expect(hover?.contents).toMatchObject({ kind: 'markdown', value: expect.stringContaining('CLASS_SYNTAX_ERROR') })
  expect((hover?.contents as { value: string }).value).not.toContain('```css')
})
