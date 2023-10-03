import { expectOrderOfRules, testProp } from './css'

it('checks padding order', () => {
    expectOrderOfRules(
        ['px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0'],
        ['p:0', 'px:0', 'py:0', 'pb:0', 'pl:0', 'pr:0', 'pt:0']
    )
})

it('validates padding rules', () => {
    testProp('pl:16', 'padding-left:1rem')
    testProp('pr:16', 'padding-right:1rem')
    testProp('pt:16', 'padding-top:1rem')
    testProp('pb:16', 'padding-bottom:1rem')
    testProp('p:16', 'padding:1rem')
    testProp('px:16', 'padding-left:1rem;padding-right:1rem')
    testProp('py:16', 'padding-top:1rem;padding-bottom:1rem')
    testProp('padding-x:16', 'padding-left:1rem;padding-right:1rem')
    testProp('padding-y:16', 'padding-top:1rem;padding-bottom:1rem')
})