import { expect, test } from 'vitest'
import { MasterCSSScanner } from './test-scanner'

test('BH-0012 scans native ESM module class strings', async () => {
  const scanner = await new MasterCSSScanner({ verbose: 0 }).init()
  try {
    await scanner.scanModule('component.mjs', 'export const classes = "block"')
    expect(scanner.css.text).toContain('.block{display:block}')
  } finally {
    await scanner.dispose()
  }
})

test('audit control: replaced sources are cleared by reset and can be rescanned', async () => {
  const scanner = await new MasterCSSScanner({ verbose: 0 }).init()
  try {
    await scanner.scan('a.html', '<div class="block"></div>')
    await scanner.scan('a.html', '<div class="hidden"></div>')
    expect([...scanner.validClasses]).toEqual(['hidden'])
    await scanner.reset()
    expect(scanner.state.cachedSources).toBe(0)
    expect(scanner.css.text).toBe('')
    await scanner.scan('a.html', '<div class="hidden"></div>')
    expect([...scanner.validClasses]).toEqual(['hidden'])
  } finally {
    await scanner.dispose()
  }
})

test.each([
  ['component.mjs?import', true],
  ['component.mjs?type=script', true],
  ['component.mjs?type=style', false],
  ['component.css', false],
  ['component.json', false],
  ['component.wasm', false]
])('BH-0012 module filtering for %s yields supported=%s', async (source, supported) => {
  const scanner = await new MasterCSSScanner({ verbose: 0 }).init()
  try {
    await scanner.scanModule(source, 'export const classes = "block"')
    expect(scanner.css.text.includes('.block{display:block}')).toBe(supported)
  } finally {
    await scanner.dispose()
  }
})
