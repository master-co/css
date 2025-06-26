import { describe } from 'node:test'
import CSSTester from './tester'
import { variables, rules, modes } from '../src'

describe('frame', () => {
    new CSSTester({
        variables: variables,
        modes: modes,
        rules: rules,
    }, null)
        .classText({
            'bb:lightest': 'border-bottom-color:var(--color-frame-lightest)',
        })
})