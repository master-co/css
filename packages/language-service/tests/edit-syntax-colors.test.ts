import { test, it, expect, describe } from 'vitest'
import CSSLanguageService from './helpers/rc87-language-service'
import createDoc from '../src/utils/create-doc'
import { ColorInformation } from 'vscode-languageserver-protocol'
import { createPresetManifest } from './helpers/create-preset-manifest'

const expectEditedColors = async ({
  before,
  after,
  source
}: {
  before: string
  after: string
  source: RegExp
}) => {
  const beforeContent = `export default () => <div className='fg:${before}'></div>`
  const afterContent = `export default () => <div className='fg:${after}'></div>`
  const beforeDoc = createDoc('tsx', beforeContent)
  const afterDoc = createDoc('tsx', afterContent)
  const languageService = new CSSLanguageService({ manifest: createPresetManifest() })
  const beforeColorInformation = (await languageService.renderSyntaxColors(beforeDoc))?.[0] as ColorInformation
  const afterColorInformation = (await languageService.renderSyntaxColors(afterDoc))?.[0] as ColorInformation
  const presentations = languageService.editSyntaxColors(
    beforeDoc,
    afterColorInformation.color,
    beforeColorInformation.range
  ) ?? []
  const labels = presentations.map(({ label }) => label)
  expect(labels[0]).toMatch(source)
  expect(labels).toEqual(expect.arrayContaining([
    expect.stringMatching(/^#[\da-f]{6}(?:[\da-f]{2})?$/u),
    expect.stringMatching(/^rgb\(/u),
    expect.stringMatching(/^hsl\(/u),
    expect.stringMatching(/^oklch\(/u)
  ]))
  expect(new Set(labels).size).toBe(labels.length)
  expect(presentations.every(({ label, textEdit }) =>
    textEdit?.newText === label && textEdit.range === beforeColorInformation.range
  )).toBe(true)
}

test.concurrent('hex', async () => {
  await expectEditedColors({ before: '#333333', after: 'rgb(40%|40%|40%)', source: /^#/u })
})

test.concurrent('variable', async () => {
  await expectEditedColors({ before: 'white/.5', after: 'oklch(100%|0|none/0.5)', source: /^oklch\(/u })
})

test.concurrent('rgb', async () => {
  await expectEditedColors({ before: 'rgb(0|255|145)', after: 'rgb(70.59%|85.49%|78.82%)', source: /^rgb\(/u })
})

test.concurrent('rgba', async () => {
  await expectEditedColors({ before: 'rgba(255|0|0/.5)', after: 'rgb(81.18%|50.59%|50.59%/0.5)', source: /^rgb\(/u })
})

test.concurrent('hsl', async () => {
  await expectEditedColors({ before: 'hsl(50|80%|40%)', after: 'hsl(230|80%|40%)', source: /^hsl\(/u })
})

test.concurrent('hsla', async () => {
  await expectEditedColors({ before: 'hsla(50|80%|40%/.5)', after: 'hsl(133|80%|40%/0.5)', source: /^hsl\(/u })
})

test.concurrent('hwb', async () => {
  await expectEditedColors({ before: 'hwb(12|50%|10%)', after: 'hwb(332|50%|10%)', source: /^hwb\(/u })
})

test.concurrent('lab', async () => {
  await expectEditedColors({ before: 'lab(52%|40|60)', after: 'lab(67%|-35|-20)', source: /^lab\(/u })
})

test.concurrent('lch', async () => {
  await expectEditedColors({ before: 'lch(50%|72|50)', after: 'lch(70%|82|139)', source: /^lch\(/u })
})

test.concurrent('oklab', async () => {
  await expectEditedColors({ before: 'oklab(50%|0.1|0.11)', after: 'oklab(38%|0.04|-0.08)', source: /^oklab\(/u })
})

test.concurrent('oklch', async () => {
  await expectEditedColors({ before: 'oklch(40%|0.1|21)', after: 'oklch(54%|0.0951|115)', source: /^oklch\(/u })
})

test.concurrent('hex to hex8', async () => {
  await expectEditedColors({ before: '#333333', after: 'rgb(40%|40%|40%/0)', source: /^#[\da-f]{8}$/u })
})
