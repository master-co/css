import { test, it, expect, describe } from 'vitest'
import CSSLanguageService from '../src/core'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'
import { Position } from 'vscode-languageserver-textdocument'
import dedent from 'ts-dedent'
import { Settings } from '../src'

export const inspect = (target: string, settings: Settings = {}) => {
  const content = `export default () => <div className='${target}'></div>`
  const doc = createDoc('tsx', content)
  const range = getRange(target, doc)
  const languageService = new CSSLanguageService(settings)
  return languageService.inspectSyntax(doc, range?.start as Position)
}

test.concurrent('text-center', async () => {
  const target = 'text-center'
  const hover = inspect(target)
  expect(hover?.contents).toEqual({
    'kind': 'markdown',
    'value': dedent`
      \`\`\`css
      @layer utilities {
        .text-center {
        text-align: center
        }
      }
      \`\`\`
    `
  })
})

test.concurrent('hidden', async () => {
  const target = 'hidden'
  const hover = inspect(target)
  expect(hover?.contents).toEqual({
    'kind': 'markdown',
    'value': dedent`
      \`\`\`css
      @layer utilities {
        .hidden {
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
