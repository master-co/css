import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../src'
import areRuleSelectorsEqual from '../../src/utils/are-rule-selectors-equal'

test.concurrent('suffix selectors', () => {
    expect(areRuleSelectorsEqual(
        new MasterCSS().generate('font:16:hover')[0],
        new MasterCSS().generate('font:16:hover')[0])
    ).toBeTruthy()

    expect(areRuleSelectorsEqual(
        new MasterCSS().generate('font:16:active')[0],
        new MasterCSS().generate('font:16:hover')[0])
    ).toBeFalsy()
})