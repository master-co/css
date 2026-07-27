import { test, it, expect, describe } from 'vitest'
import { Position } from 'vscode-languageserver-textdocument'
import CSSLanguageService from '../helpers/rc87-language-service'
import createDoc from '../../src/utils/create-doc'

const languageService = new CSSLanguageService()

it.concurrent('types next class and starts with white space', () => {
  const target = ''
  const contents = [`export default () => <div className="abs `, target, `"></div>`]
  const doc = createDoc('tsx', contents.join(''))
  const completionItems = languageService.suggestSyntax(doc, { line: 0, character: contents[0].length } as Position, {
    triggerKind: 2,
    triggerCharacter: target.charAt(target.length - 1)
  })
  expect(completionItems?.find(({ label }) => label === 'block')).toBeDefined()
})

it.concurrent('types next class and starts with b', () => {
  const target = 'b'
  const contents = [`export default () => <div className="abs `, target, `"></div>`]
  const doc = createDoc('tsx', contents.join(''))
  const completionItems = languageService.suggestSyntax(doc, { line: 0, character: contents[0].length } as Position, {
    triggerKind: 2,
    triggerCharacter: target.charAt(target.length - 1)
  })
  expect(completionItems?.find(({ label }) => label === 'block')).toBeDefined()
})

it.concurrent('types inside spaced jsx attribute assignment', () => {
  const target = 'b'
  const contents = [`export default () => <div className = "abs `, target, `"></div>`]
  const doc = createDoc('tsx', contents.join(''))
  const completionItems = languageService.suggestSyntax(doc, { line: 0, character: contents[0].length } as Position, {
    triggerKind: 2,
    triggerCharacter: target.charAt(target.length - 1)
  })
  expect(completionItems?.find(({ label }) => label === 'block')).toBeDefined()
})

