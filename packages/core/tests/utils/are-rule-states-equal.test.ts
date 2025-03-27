import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'
import areRuleStatesEqual from '../../src/utils/are-rule-states-equal'

test.concurrent('at same', () => {
    expect(areRuleStatesEqual(
        new MasterCSS().generate('block:hover@sm')[0],
        new MasterCSS().generate('block:hover@sm')[0])
    ).toBeTruthy()
})

test.concurrent('at diff', () => {
    expect(areRuleStatesEqual(
        new MasterCSS().generate('block:hover@sm')[0],
        new MasterCSS().generate('block:hover@md')[0])
    ).toBeFalsy()
})