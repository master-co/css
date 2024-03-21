import CSSLanguageService from '../src/core'
import createDoc from '../src/utils/create-doc'
import { ColorInformation, ColorPresentation } from 'vscode-languageserver'

const simulateEditingColors = async ({ before, after }: { before: string, after: string }) => {
    const beforeContent = `export default () => <div className='fg:${before}'></div>`
    const afterContent = `export default () => <div className='fg:${after}'></div>`
    const beforeDoc = createDoc('tsx', beforeContent)
    const afterDoc = createDoc('tsx', afterContent)
    const languageService = new CSSLanguageService()
    const beforeColorInformation = (await languageService.onDocumentColor(beforeDoc))?.[0] as ColorInformation
    const afterColorInformation = (await languageService.onDocumentColor(afterDoc))?.[0] as ColorInformation
    expect(await languageService.onColorPresentation(beforeDoc, afterColorInformation.color, beforeColorInformation.range))
        .toStrictEqual([{
            label: after,
            textEdit: {
                newText: after,
                range: beforeColorInformation.range
            }
        }] as ColorPresentation[])
}

test('hex', async () => {
    await simulateEditingColors({ before: '#333333', after: '#666666' })
})

test('variable', async () => {
    await simulateEditingColors({ before: 'blue-50/.5', after: 'rgb(112|141|200/0.5)' })
})

test('rgb', async () => {
    await simulateEditingColors({ before: 'rgb(0|255|145)', after: 'rgb(180|218|201)' })
})

test('rgba', async () => {
    await simulateEditingColors({ before: 'rgba(255|0|0/.5)', after: 'rgb(207|129|129/0.5)' })
})

test('hsl', async () => {
    await simulateEditingColors({ before: 'hsl(50|80%|40%)', after: 'hsl(230|80%|40%)' })
})

test('hsla', async () => {
    await simulateEditingColors({ before: 'hsla(50|80%|40%/.5)', after: 'hsl(133|80%|40%/0.5)' })
})

test('hwb', async () => {
    await simulateEditingColors({ before: 'hwb(12|50%|10%)', after: 'hwb(332|50%|10%)' })
})

test('lab', async () => {
    await simulateEditingColors({ before: 'lab(52%|40|60)', after: 'lab(67%|-35|-20)' })
})

test('lch', async () => {
    await simulateEditingColors({ before: 'lch(50%|72|50)', after: 'lch(70%|82|139)' })
})

test('oklab', async () => {
    await simulateEditingColors({ before: 'oklab(50%|0.1|0.11)', after: 'oklab(38%|0.0877|-0.1906)' })
})

test('oklch', async () => {
    await simulateEditingColors({ before: 'oklch(40%|0.1|21)', after: 'oklch(54%|0.0951|115)' })
})

test('hex to hex8', async () => {
    await simulateEditingColors({ before: '#333333', after: '#66666600' })
})