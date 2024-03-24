import { Position, Range } from 'vscode-languageserver'
import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import getRange from '../src/utils/get-range'

const simulateGettingClassPosition = async (target: string) => {
    const content = `<div class="${target}"></div>`
    const doc = createDoc('html', content)
    const range = getRange(target, doc)
    const languageService = new CSSLanguageService()
    expect(languageService.getClassPosition(doc, range.start)).toEqual({
        range: {
            start: range.start.character,
            end: range.end.character
        },
        token: target
    })
}

it('types in class', async () => {
    const content = `<div class=""></div>`
    const doc = createDoc('html', content)
    const position: Position = { line: 0, character: 12 }
    const languageService = new CSSLanguageService()
    expect(languageService.getClassPosition(doc, position)).toEqual({
        range: {
            start: position.character,
            end: position.character
        },
        token: ''
    })
})

it('types a in class', async () => {
    simulateGettingClassPosition('a')
})

// test('basic', () => simulateGettingClassPosition('text:center'))