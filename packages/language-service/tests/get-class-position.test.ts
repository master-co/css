import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import getRange from '../src/utils/get-range'

// it('types', async () => {
//     const content = `<div class=""></div>`
//     const doc = createDoc('html', content)
//     const position: Position = { line: 0, character: 12 }
//     const languageService = new CSSLanguageService()
//     expect(languageService.getClassPosition(doc, position)).toEqual({
//         range: {
//             start: position.character,
//             end: position.character
//         },
//         token: ''
//     })
// })

it('types a single class', () => {
    const target = 'class-a'
    const contents = ['<div class="', target, '"></div>']
    const doc = createDoc('html', contents.join(''))
    const languageService = new CSSLanguageService()
    expect(languageService.getClassPosition(doc, { line: 0, character: contents[0].length })).toEqual({
        range: {
            start: contents[0].length,
            end: contents[0].length + target.length
        },
        token: target
    })
})

it('types two classes', () => {
    const target = 'class-b'
    const contents = ['<div class="class-a ', target, '"></div>']
    const doc = createDoc('html', contents.join(''))
    const languageService = new CSSLanguageService()
    expect(languageService.getClassPosition(doc, { line: 0, character: contents[0].length })).toEqual({
        range: {
            start: contents[0].length,
            end: contents[0].length + target.length
        },
        token: target
    })
})

describe('react', () => {
    it('clsx', () => {
        const target = 'class-b'
        const contents = ['export default () => <div className={clsx("class-a","', target, '")}></div>']
        const doc = createDoc('tsx', contents.join(''))
        const languageService = new CSSLanguageService()
        expect(languageService.getClassPosition(doc, { line: 0, character: contents[0].length })).toEqual({
            range: {
                start: contents[0].length,
                end: contents[0].length + target.length
            },
            token: target
        })
    })
})

// test('basic', () => simulateGettingClassPosition('text:center'))