import areRuleSelectorsEqual from '../../src/functions/are-rule-selectors-equal'

test('suffix selectors', () => {
    expect(areRuleSelectorsEqual(
        new MasterCSS().generate('font:16:hover')[0],
        new MasterCSS().generate('font:16:hover')[0])
    ).toBeTruthy()

    expect(areRuleSelectorsEqual(
        new MasterCSS().generate('font:16:active')[0],
        new MasterCSS().generate('font:16:hover')[0])
    ).toBeFalsy()
})

test('prefix selectors', () => {
    expect(areRuleSelectorsEqual(
        new MasterCSS().generate('.active_{font:16}')[0],
        new MasterCSS().generate('.active_{font:32}')[0])
    ).toBeTruthy()

    expect(areRuleSelectorsEqual(
        new MasterCSS().generate('.active:hover_{font:16}')[0],
        new MasterCSS().generate('.active_{font:32}')[0])
    ).toBeFalsy()
})