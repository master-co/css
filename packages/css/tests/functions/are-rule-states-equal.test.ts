import areRuleStatesEqual from '../../src/functions/are-rule-states-equal'

test('states', () => {
    expect(areRuleStatesEqual(
        new MasterCSS().generate('font:16:hover@sm')[0],
        new MasterCSS().generate('font:32:hover@sm')[0])
    ).toBeTruthy()

    expect(areRuleStatesEqual(
        new MasterCSS().generate('font:16:hover@sm')[0],
        new MasterCSS().generate('font:32:focus@sm')[0])
    ).toBeFalsy()
})