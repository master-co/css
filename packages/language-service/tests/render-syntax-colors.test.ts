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
        color: { red: 0.6, green: 0.6, blue: 0.6, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('shorthand', async () => {
    const target = 'black'
    const content = `
        export default () => <div className='b:1|solid|${target}'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: 1 },
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

test('with variable', async () => {
    const target = 'custom'
    const content = `
        export default () => <div className='fg:${target}!'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService({
        config: {
            variables: {
                custom: '#333333'
            }
        }
    })
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: .2, green: .2, blue: .2, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('with variable/opacity', async () => {
    const target = 'blue-50/.5'
    const content = `
        export default () => <div className='fg:${target}'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: 0.22745098039215686, green: 0.48627450980392156, blue: 1, alpha: .5 },
        range: getRange(target, doc)
    }])
})

test.todo('with variable alpha')
test('with variable alpha', async () => {
    const target = 'custom/.5'
    const content = `
        export default () => <div className='fg:${target}!'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService({
        config: {
            variables: {
                custom: '#333333'
            }
        }
    })
    expect(await languageService.onDocumentColor(doc)).toEqual([{
        color: { red: 0.2, green: 0.2, blue: 0.2, alpha: 0.5 },
        range: getRange(target, doc)
    }])
})

test('invalid rgb should no color informations', async () => {
    const target = 'rgb(0,0,)'
    const content = `
        export default () => <div className='fg:${target}'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([])
})

test('semantic class should be ignored', async () => {
    const target = 'block'
    const content = `
        export default () => <div className='fg:${target}'></div>
    `
    const doc = createDoc('tsx', content)
    const languageService = new MasterCSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toEqual([])
})

describe('color space', () => {
    test('rgb', async () => {
        const target = 'rgb(125,125,0)'
        const content = `
        export default () => <div className='fg:${target}'></div>
    `
        const doc = createDoc('tsx', content)
        const languageService = new MasterCSSLanguageService()
        expect(await languageService.onDocumentColor(doc)).toEqual([{
            color: { red: 0.49019607843137253, green: 0.49019607843137253, blue: 0, alpha: 1 },
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
            color: { red: 0.29411764705882354, green: 0, blue: 0.49019607843137253, alpha: 1 },
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
            color: { red: 0.48, green: 0.72, blue: 0.6000000000000001, alpha: .1 },
            range: getRange(target, doc)
        }])
    })
})

// ? not supported yet
// test('group', async () => {
//     const target = '#000'
//     const content = `
//         export default () => <div className='{fg:${target}}'></div>
//     `
//     const doc = createDoc('tsx', content)
//     const languageService = new MasterCSSLanguageService()
//     expect(await languageService.onDocumentColor(doc)).toEqual([{
//         color: { red: 0, green: 0, blue: 0, alpha: 1 },
//         range: getRange(target, doc)
//     }])
// })