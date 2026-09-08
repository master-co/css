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

test('audit control: accumulated sources are cleared by reset and can be rescanned', async () => {
  const scanner = await new MasterCSSScanner({ verbose: 0 }).init()
  try {
    await scanner.scan('a.html', '<div class="block"></div>')
    await scanner.scan('a.html', '<div class="hidden"></div>')
    expect([...scanner.validClasses]).toEqual(['block', 'hidden'])
    await scanner.reset()
    expect(scanner.state.cachedSources).toBe(0)
    expect(scanner.css.text).toBe('')
    await scanner.scan('a.html', '<div class="hidden"></div>')
    expect([...scanner.validClasses]).toEqual(['hidden'])
  } finally {
    await scanner.dispose()
  }
})
