import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'

test('empty class', () => {
    const contents = ['<div class="', '"></div>']
    const doc = createDoc('html', contents.join(''))
    const languageService = new CSSLanguageService()
    expect(languageService.getClassPosition(doc, { line: 0, character: contents[0].length })).toEqual({
        range: {
            start: contents[0].length,
            end: contents[0].length
        },
        token: ''
    })
})

test('one class', () => {
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

test('two classes', () => {
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
    test('clsx in className={}', () => {
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