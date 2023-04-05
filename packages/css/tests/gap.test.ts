import { expectOrderOfRules, testProp } from './css'

it('validates gap rules', () => {
    testProp('gap-x:16', 'gap-x:1rem')
    testProp('gap-y:16', 'gap-y:1rem')
    testProp('gap:16', 'gap:1rem')
})

it('checks gap order', () => {
    expectOrderOfRules(
        ['gap-x:0', 'gap:0', 'gap-y:0'],
        ['gap:0', 'gap-y:0', 'gap-x:0']
    )
})