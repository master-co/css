import { expect, it } from 'vitest'
import { MasterCSSScanner } from '../test-scanner'

it('rejects excluded modules', async () => {
  const scanner = await new MasterCSSScanner({
    exclude: ['manual-source.ts']
  }, __dirname).init()

  expect(scanner.isModuleAllowed('manual-source.ts')).toBe(false)
})

it('accepts source-like modules that are not excluded', async () => {
  const scanner = await new MasterCSSScanner({
    exclude: []
  }, __dirname).init()

  expect(scanner.isModuleAllowed('manual-source.ts')).toBe(true)
})
