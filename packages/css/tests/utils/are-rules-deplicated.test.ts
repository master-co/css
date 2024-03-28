import areRulesDuplicated from '../../src/utils/are-rules-duplicated'

test('rules', () => {
    expect(areRulesDuplicated(
        new MasterCSS().generate('font:16')[0],
        new MasterCSS().generate('font:32')[0])
    ).toBeTruthy()

    expect(areRulesDuplicated(
        new MasterCSS().generate('text:16')[0],
        new MasterCSS().generate('font:32')[0])
    ).toBeFalsy()

    expect(areRulesDuplicated(
        new MasterCSS().generate('block')[0],
        new MasterCSS().generate('display:none')[0])
    ).toBeTruthy()
})