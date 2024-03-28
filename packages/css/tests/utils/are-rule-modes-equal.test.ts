import areRuleModesEqual from '../../src/utils/are-rule-modes-equal'

test('mode', () => {
    expect(areRuleModesEqual(
        new MasterCSS().generate('font:16')[0],
        new MasterCSS().generate('font:32')[0])
    ).toBeTruthy()

    expect(areRuleModesEqual(
        new MasterCSS().generate('font:16@dark')[0],
        new MasterCSS().generate('font:32@light')[0])
    ).toBeFalsy()

    expect(areRuleModesEqual(
        new MasterCSS().generate('font:16')[0],
        new MasterCSS().generate('font:32@light')[0])
    ).toBeFalsy()

    expect(areRuleModesEqual(
        new MasterCSS().generate('font:16@light')[0],
        new MasterCSS().generate('font:32@light')[0])
    ).toBeTruthy()
})