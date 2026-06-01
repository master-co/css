import { describe, test, expect } from 'vitest'
import { MasterCSS } from '../../src'
import defaultConfig from '../../src/config'

describe('issue #363: `|` separator inside `{...}` groups', () => {
    test('{paint-order:stroke|fill} expands `|` to space inside group', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('{paint-order:stroke|fill}')
        expect(rule?.text).toContain('paint-order:stroke fill')
        expect(rule?.text).not.toContain('paint-order:stroke|fill')
    })

    test('{paint-order:stroke} single value still works (regression)', () => {
        const css = new MasterCSS(defaultConfig)
        expect(css.create('{paint-order:stroke}')?.text).toContain('paint-order:stroke')
    })

    test('regular bg:white|red still treats `|` as space (regression)', () => {
        const css = new MasterCSS(defaultConfig)
        const rule = css.create('bg:white|red')
        // bg expects multi-token; `|` is a class-safe space
        expect(rule?.text).toBeTruthy()
        // `|` may legitimately appear in the escaped class selector, but never in declarations
        const declStart = rule!.text.indexOf('{')
        expect(rule!.text.slice(declStart)).not.toContain('|')
    })

    test('three-value list works in group', () => {
        const css = new MasterCSS(defaultConfig)
        expect(css.create('{paint-order:stroke|fill|markers}')?.text)
            .toContain('paint-order:stroke fill markers')
    })
})
