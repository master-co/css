import { test, expect } from 'vitest'
import { Settings } from '../../src'
import CSSLanguageService from '../../src/core'
import createDoc, { languageIdOfExt } from '../../src/utils/create-doc'

export const expectClassPosition = (target: string, contents: string[], ext: keyof typeof languageIdOfExt = 'html', settings?: Settings) => {
    const doc = createDoc(ext, contents.join(''))
    const languageService = new CSSLanguageService(settings)
    const classPosition = languageService.getClassPosition(doc, doc.positionAt(contents[0].length + target.length))
    expect(classPosition).toEqual({
        range: {
            start: contents[0].length,
            end: contents[0].length + target.length
        },
        raw: target,
        token: target
            .replace(/\\\\"/g, '"')
            .replace(/\\\\'/g, '\'')
            .replace(/\\\\`/g, '`')
    })
    return classPosition
}

test.concurrent('empty class with single quotes', () => {
    const target = ''
    const contents = ['<div class=\'', target, '\'></div>']
    expectClassPosition(target, contents)
})

test.concurrent('empty class with double quotes', () => {
    const target = ''
    const contents = ['<div class="', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('one class', () => {
    const target = 'class-a'
    const contents = ['<div class="', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('two classes', () => {
    const target = 'class-b'
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('valid classes', () => {
    const target = 'bg:black'
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('quote in class', () => {
    const target = `content:''`
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('group syntax', () => {
    const target = '{abs}'
    const contents = ['<div class="class-a ', target, '"></div>']
    expectClassPosition(target, contents)
})

test.concurrent('ignores class attributes inside HTML comments', () => {
    const doc = createDoc('html', '<!-- <div class="fg:red"></div> -->\n<div class="fg:blue"></div>')
    const languageService = new CSSLanguageService()

    expect(languageService.getClassPositions(doc).map((classPosition) => classPosition.token)).toEqual([
        'fg:blue'
    ])
    expect(languageService.getClassPosition(doc, doc.positionAt(17))).toBeUndefined()
})

test.concurrent('nested strings and literals', () => {
    const target = `content:\\'\\'`
    const contents = [`export default () => <div className={'block `, target, `'}>hello world</div>`]
    expectClassPosition(target, contents, 'tsx')
})
