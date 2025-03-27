import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'
import areRuleAtEqual from '../../src/utils/are-rule-at-equal'

test.concurrent('min-width', () => {
    expect(areRuleAtEqual(
        new MasterCSS().generate('font:16@sm')[0],
        new MasterCSS().generate('font:32@sm')[0])
    ).toBeTruthy()
})

test.concurrent('range', () => {
    expect(areRuleAtEqual(
        new MasterCSS().generate('font:16@sm&md')[0],
        new MasterCSS().generate('font:32@md&sm')[0])
    ).toBeTruthy()
})

test.concurrent('no at-token', () => {
    expect(areRuleAtEqual(
        new MasterCSS().generate('font:16')[0],
        new MasterCSS().generate('font:32@sm')[0])
    ).toBeFalsy()
})

test.concurrent('nest group', () => {
    expect(areRuleAtEqual(
        new MasterCSS().generate('font:16@sm&!(print,screen)')[0],
        new MasterCSS().generate('font:16@!(print,screen)&sm')[0])
    ).toBeTruthy()
})

test.concurrent('supports and media', () => {
    expect(areRuleAtEqual(
        new MasterCSS().generate('font:16@sm')[0],
        new MasterCSS().generate('font:32@sm@supports(backdrop-filter:none)')[0])
    ).toBeFalsy()
})