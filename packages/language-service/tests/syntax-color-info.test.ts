import MasterCSSLanguageService from '../src/core'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'

test('hex', async () => {
    const target = '#999999'
    const content = `
        export default () => <div className='fg:${target}'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: 153, green: 153, blue: 153, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('with |', async () => {
    const target = 'rgb(0|0|0/.5)'
    const content = `
        export default () => <div className='fg:${target}'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: .5 },
        range: getRange(target, doc)
    }])
})

test('with !', async () => {
    const target = 'rgb(0|0|0)'
    const content = `
        export default () => <div className='fg:${target}!'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: 1 },
        range: getRange(target, doc)
    }])
})

// test('invalid rgb should no color informations', async () => {
//     const target = 'rgb(0,0,)'
//     const content = `
//         export default () => <div className='fg:${target}'></div>
//     `
//     const doc = createDoc('tsx', content)
//     const languageService = new MasterCSSLanguageService()
//     expect(await languageService.onDocumentColor(doc)).toEqual([])
// })

test('group', async () => {
    const target = '#000'
    const content = `
        export default () => <div className='{fg:${target}}'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: 1 },
        range: getRange(target, doc)
    }])
})

describe('color space', () => {
    test('rgb', async () => {
        const target = 'rgb(0,0,0)'
        const content = `
        export default () => <div className='fg:${target}'></div>
    `
        const doc = createDoc('tsx', content)
        const languageService = new MasterCSSLanguageService()
        expect(await languageService.onDocumentColor(doc)).toEqual([{
            color: { red: 0, green: 0, blue: 0, alpha: 1 },
            range: getRange(target, doc)
        }])
    })

    test('lab', async () => {
        const target = 'lab(75%,-120,125)'
        const content = `
            export default () => <div className='fg:${target}'></div>
        `
        const doc = createDoc('tsx', content)
        const languageService = new MasterCSSLanguageService()
        expect(await languageService.onDocumentColor(doc)).toEqual([{
            color: { red: 75, green: 0, blue: 125, alpha: 1 },
            range: getRange(target, doc)
        }])
    })

    test('hsla', async () => {
        const target = 'hsla(150deg,30%,60%,.1)'
        const content = `
            export default () => <div className='fg:${target}'></div>
        `
        const doc = createDoc('tsx', content)
        const languageService = new MasterCSSLanguageService()
        expect(await languageService.onDocumentColor(doc)).toEqual([{
            color: { red: 122.39999999999999, green: 183.6, blue: 153.00000000000003, alpha: .1 },
            range: getRange(target, doc)
        }])
    })
})