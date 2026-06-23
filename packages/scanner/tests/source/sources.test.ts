import { expect, it } from 'vitest'
import CSSScanner from '../../src'

it('rejects excluded modules', async () => {
    const scanner = await new CSSScanner({
        exclude: ['manual-source.ts']
    }, __dirname).init()

    expect(scanner.isModuleAllowed('manual-source.ts')).toBe(false)
})

it('accepts source-like modules that are not excluded', async () => {
    const scanner = await new CSSScanner({
        exclude: []
    }, __dirname).init()

    expect(scanner.isModuleAllowed('manual-source.ts')).toBe(true)
})
