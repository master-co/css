import CSSLanguageService from '../src/core'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'

test('hex', async () => {
    const target = '#999999'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: 0.6, green: 0.6, blue: 0.6, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('shorthand', async () => {
    const target = 'black'
    const content = `export default () => <div className='b:1|solid|${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('with |', async () => {
    const target = 'rgb(0|0|0/.5)'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: .5 },
        range: getRange(target, doc)
    }])
})

test('with !', async () => {
    const target = 'rgb(0|0|0)'
    const content = `export default () => <div className='fg:${target}!'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('should ignore invalid rgb', async () => {
    const target = 'rgb(0,0,)'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([])
})

test('should ignore single #', async () => {
    const target = '#'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([])
})

test('should ignore semantic', async () => {
    const target = 'block'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([])
})

test('should ignore number', async () => {
    const target = '4x'
    const content = `export default () => <div className='m:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([])
})

test('box-shadow', async () => {
    const target1 = 'black'
    const target2 = 'white'
    const content = `export default () => <div className='shadow:1|1|2|${target1},2|2|3|${target2}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([
        {
            color: { red: 0, green: 0, blue: 0, alpha: 1 },
            range: getRange(target1, doc)
        },
        {
            color: { red: 1, green: 1, blue: 1, alpha: 1 },
            range: getRange(target2, doc)
        }
    ])
})

test('gradient', async () => {
    const target1 = 'black'
    const target2 = 'white'
    const content = `export default () => <div className='gradient(${target1},${target2})'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([
        {
            color: { red: 0, green: 0, blue: 0, alpha: 1 },
            range: getRange(target1, doc)
        },
        {
            color: { red: 1, green: 1, blue: 1, alpha: 1 },
            range: getRange(target2, doc)
        }
    ])
})

test('custom variable', async () => {
    const target = 'custom'
    const content = `export default () => <div className='fg:${target}!'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService({
        config: {
            variables: {
                custom: '#333333'
            }
        }
    })
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: .2, green: .2, blue: .2, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('custom variable/alpha', async () => {
    const target = 'custom/.5'
    const content = `export default () => <div className='fg:${target}!'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService({
        config: {
            variables: {
                custom: '#333333'
            }
        }
    })
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: 0.2, green: 0.2, blue: 0.2, alpha: 0.5 },
        range: getRange(target, doc)
    }])
})

test('variable', async () => {
    const target = 'black'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: 0, green: 0, blue: 0, alpha: 1 },
        range: getRange(target, doc)
    }])
})

test('variable/opacity', async () => {
    const target = 'blue-50/.5'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = new CSSLanguageService()
    expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
        color: { red: 0.22745098039215686, green: 0.48627450980392156, blue: 1, alpha: .5 },
        range: getRange(target, doc)
    }])
})

test.todo('CSS color() function')
test.todo('CSS color-mix() function')
test.todo('click to switch color spaces')

describe('color space', () => {
    test('rgb', async () => {
        const target = 'rgb(125,125,0)'
        const content = `export default () => <div className='fg:${target}'></div>`
        const doc = createDoc('tsx', content)
        const languageService = new CSSLanguageService()
        expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
            color: { red: 0.49019607843137253, green: 0.49019607843137253, blue: 0, alpha: 1 },
            range: getRange(target, doc)
        }])
    })

    test('lab', async () => {
        const target = 'lab(75%|-120|125)'
        const content = `export default () => <div className='fg:${target}'></div>`
        const doc = createDoc('tsx', content)
        const languageService = new CSSLanguageService()
        expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
            color: { red: -0.5785846942837092, green: 0.8926026860675246, blue: -0.3426081149839405, alpha: 1 },
            range: getRange(target, doc)
        }])
    })

    test('hsla', async () => {
        const target = 'hsla(150deg,30%,60%,.1)'
        const content = `export default () => <div className='fg:${target}'></div>`
        const doc = createDoc('tsx', content)
        const languageService = new CSSLanguageService()
        expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
            color: { red: 0.48, green: 0.72, blue: 0.6, alpha: .1 },
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
//     const languageService = new CSSLanguageService()
//     expect(await languageService.onDocumentColor(doc)).toStrictEqual([{
//         color: { red: 0, green: 0, blue: 0, alpha: 1 },
//         range: getRange(target, doc)
//     }])
// })