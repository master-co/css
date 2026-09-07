import { test, it, expect, describe } from 'vitest'

import CSSLanguageService from './helpers/rc87-language-service'
import getRange from '../src/utils/get-range'
import createDoc from '../src/utils/create-doc'
import { createPresetManifest } from './helpers/create-preset-manifest'

function createLanguageService(settings: ConstructorParameters<typeof CSSLanguageService>[0] = {}) {
  return new CSSLanguageService({
    ...settings,
    manifest: createPresetManifest(settings.manifest)
  })
}

test.concurrent('hex', async () => {
  const target = '#999999'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 0.6, green: 0.6, blue: 0.6, alpha: 1 },
    range: getRange(target, doc)
  }])
})

test.concurrent('shorthand', async () => {
  const target = 'black'
  const content = `export default () => <div className='b:1px|solid|${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 0, green: 0, blue: 0, alpha: 1 },
    range: getRange(target, doc)
  }])
})

test.concurrent('with |', async () => {
  const target = 'rgb(0|0|0/.5)'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 0, green: 0, blue: 0, alpha: .5 },
    range: getRange(target, doc)
  }])
})

test.concurrent('with !', async () => {
  const target = 'rgb(0|0|0)'
  const content = `export default () => <div className='fg:${target}!'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 0, green: 0, blue: 0, alpha: 1 },
    range: getRange(target, doc)
  }])
})

test.concurrent('should ignore invalid rgb', async () => {
  const target = 'rgb(0,0,)'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([])
})

test.concurrent('should ignore single #', async () => {
  const target = '#'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([])
})

test.concurrent('should ignore utility', async () => {
  const target = 'block'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([])
})

test.concurrent('should ignore number', async () => {
  const target = '4x'
  const content = `export default () => <div className='m:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([])
})

test.concurrent('box-shadow', async () => {
  const target1 = 'black'
  const target2 = 'white'
  const content = `export default () => <div className='shadow:1px|1px|2px|${target1},2px|2px|3px|${target2}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([
    {
      color: { red: 0, green: 0, blue: 0, alpha: 1 },
      range: getRange(target1, doc)
    },
    {
      color: { red: 1, green: 0.9999999999999994, blue: 0.9999999999999999, alpha: 1 },
      range: getRange(target2, doc)
    }
  ])
})

test.concurrent('gradient', async () => {
  const target1 = 'black'
  const target2 = 'white'
  const content = `export default () => <div className='bg:linear-gradient(${target1},${target2})'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([
    {
      color: { red: 0, green: 0, blue: 0, alpha: 1 },
      range: getRange(target1, doc)
    },
    {
      color: { red: 1, green: 0.9999999999999994, blue: 0.9999999999999999, alpha: 1 },
      range: getRange(target2, doc)
    }
  ])
})

test.concurrent('custom variable', async () => {
  const target = 'custom'
  const content = `export default () => <div className='fg:${target}!'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService({
    manifest: createPresetManifest({
      variables: [{ namespace: 'color', key: 'custom', value: '#333333' }]
    })
  })
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: .2, green: .2, blue: .2, alpha: 1 },
    range: getRange(target, doc)
  }])
})

test.concurrent('custom variable/alpha', async () => {
  const target = 'custom/.5'
  const content = `export default () => <div className='fg:${target}!'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService({
    manifest: createPresetManifest({
      variables: [{ namespace: 'color', key: 'custom', value: '#333333' }]
    })
  })
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 0.2, green: 0.2, blue: 0.2, alpha: 0.5 },
    range: getRange(target, doc)
  }])
})

test.concurrent('variable', async () => {
  const target = 'black'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 0, green: 0, blue: 0, alpha: 1 },
    range: getRange(target, doc)
  }])
})

test.concurrent('variable/opacity', async () => {
  const target = 'black/.5'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 0, green: 0, blue: 0, alpha: .5 },
    range: getRange(target, doc)
  }])
})

test('CSS color() function', async () => {
  const target = 'color(display-p3|1|0|0)'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService()
  expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
    color: { red: 1, green: 0, blue: 0, alpha: 1 },
    range: getRange(target, doc)
  }])
})

test('CSS color-mix() function', async () => {
  const cases = [
    {
      target: 'color-mix(in|srgb,#f00,#00f)',
      color: { red: 0.5, green: 0, blue: 0.5, alpha: 1 }
    },
    {
      target: 'color-mix(in|srgb,#f00|20%,#00f|40%)',
      color: { red: 1 / 3, green: 0, blue: 2 / 3, alpha: 0.6 }
    },
    {
      target: 'color-mix(in|srgb,#f00|80%,#00f|80%)',
      color: { red: 0.5, green: 0, blue: 0.5, alpha: 1 }
    },
    {
      target: 'color-mix(in|srgb,color-mix(in|srgb,#f00,#0f0),#00f)',
      color: { red: 0.25, green: 0.25, blue: 0.5, alpha: 1 }
    },
    {
      target: 'color-mix(in|srgb,#f00,transparent)',
      color: { red: 1, green: 0, blue: 0, alpha: 0.5 }
    }
  ]
  for (const { target, color } of cases) {
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const [result] = await createLanguageService().renderSyntaxColors(doc) ?? []
    expect(result).toBeDefined()
    if (!result) throw new Error(`Expected a rendered color for ${target}.`)
    expect(result.range).toStrictEqual(getRange(target, doc))
    expect(result.color.red).toBeCloseTo(color.red)
    expect(result.color.green).toBeCloseTo(color.green)
    expect(result.color.blue).toBeCloseTo(color.blue)
    expect(result.color.alpha).toBeCloseTo(color.alpha)
  }

  const polarTarget = 'color-mix(in|oklch|longer|hue,#f00,#00f)'
  const polarDoc = createDoc('tsx', `<div class='fg:${polarTarget}'></div>`)
  expect(await createLanguageService().renderSyntaxColors(polarDoc)).toHaveLength(1)

  const aliasTarget = 'color-mix(in|srgb,brand,#00f)'
  const aliasDoc = createDoc('tsx', `<div class='fg:${aliasTarget}'></div>`)
  const [aliasResult] = await createLanguageService({
    manifest: createPresetManifest({
      variables: [{ namespace: 'color', key: 'brand', value: '#f00' }]
    })
  }).renderSyntaxColors(aliasDoc) ?? []
  expect(aliasResult).toBeDefined()
  if (!aliasResult) throw new Error('Expected a rendered manifest alias color.')
  expect(aliasResult.color).toMatchObject({ red: 0.5, green: 0, blue: 0.5, alpha: 1 })

  for (const target of [
    'color-mix(in|srgb,var(--brand),#00f)',
    'color-mix(in|srgb,currentColor,#00f)',
    'color-mix(in|srgb,#f00|0%,#00f|0%)',
    'color-mix(in|unknown,#f00,#00f)'
  ]) {
    const doc = createDoc('tsx', `<div class='fg:${target}'></div>`)
    expect(await createLanguageService().renderSyntaxColors(doc)).toStrictEqual([])
  }
})

test('click to switch color spaces', async () => {
  const target = 'color(display-p3|.2|.4|.6/.5)'
  const content = `<div class='fg:${target}'></div>`
  const doc = createDoc('html', content)
  const languageService = createLanguageService()
  const [color] = await languageService.renderSyntaxColors(doc) ?? []
  expect(color).toBeDefined()
  if (!color) throw new Error('Expected a rendered display-p3 color.')
  const presentations = languageService.editSyntaxColors(doc, color.color, color.range) ?? []
  expect(presentations.map(({ label }) => label)).toEqual([
    expect.stringMatching(/^color\(display-p3\|/u),
    expect.stringMatching(/^#[\da-f]{8}$/u),
    expect.stringMatching(/^rgb\(/u),
    expect.stringMatching(/^hsl\(/u),
    expect.stringMatching(/^oklch\(/u)
  ])
  expect(presentations.every(({ textEdit }) => textEdit?.range === color.range)).toBe(true)
})

test('convert any color spaces to RGB and hint correctly', async () => {
  for (const target of [
    'rgb(0|0|0)',
    'hsl(0|0%|0%)',
    'hwb(0|0%|100%)',
    'lab(0%|0|0)',
    'lch(0%|0|0)',
    'oklab(0%|0|0)',
    'oklch(0%|0|0)',
    'color(display-p3|0|0|0)'
  ]) {
    const content = `<div class='fg:${target}'></div>`
    const doc = createDoc('html', content)
    expect(await createLanguageService().renderSyntaxColors(doc)).toStrictEqual([{
      color: { red: 0, green: 0, blue: 0, alpha: 1 },
      range: getRange(target, doc)
    }])
  }
})

test.concurrent('maps out-of-gamut colors into the LSP channel range', async () => {
  const target = 'wide-gamut'
  const content = `export default () => <div className='fg:${target}'></div>`
  const doc = createDoc('tsx', content)
  const languageService = createLanguageService({
    manifest: createPresetManifest({
      variables: [{ namespace: 'color', key: target, value: 'oklch(70% .4 20)' }]
    })
  })
  const [result] = await languageService.renderSyntaxColors(doc) ?? []
  expect(result).toBeDefined()
  if (!result) throw new Error('Expected a rendered color.')
  expect(result.range).toStrictEqual(getRange(target, doc))
  expect(Object.values(result.color).every((value) => value >= 0 && value <= 1)).toBe(true)
})

describe.concurrent('color space', () => {
  test.concurrent('rgb', async () => {
    const target = 'rgb(125,125,0)'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = createLanguageService()
    expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
      color: { red: 0.49019607843137253, green: 0.49019607843137253, blue: 0, alpha: 1 },
      range: getRange(target, doc)
    }])
  })

  test.concurrent('lab', async () => {
    const target = 'lab(0%|0|0)'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = createLanguageService()
    expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
      color: { red: 0, green: 0, blue: 0, alpha: 1 },
      range: getRange(target, doc)
    }])
  })

  test.concurrent('hsla', async () => {
    const target = 'hsla(150deg,30%,60%,0.1)'
    const content = `export default () => <div className='fg:${target}'></div>`
    const doc = createDoc('tsx', content)
    const languageService = createLanguageService()
    expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
      color: { red: 0.48, green: 0.72, blue: 0.6, alpha: .1 },
      range: getRange(target, doc)
    }])
  })
})

// ? not supported yet
// test.concurrent('group', async () => {
//     const target = '#000'
//     const content = `
//         export default () => <div className='{fg:${target}}'></div>
//     `
//     const doc = createDoc('tsx', content)
//     const languageService = new CSSLanguageService()
//     expect(await languageService.renderSyntaxColors(doc)).toStrictEqual([{
//         color: { red: 0, green: 0, blue: 0, alpha: 1 },
//         range: getRange(target, doc)
//     }])
// })
