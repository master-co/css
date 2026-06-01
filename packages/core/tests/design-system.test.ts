import { describe } from 'node:test'
import CSSTester from './tester'
import config from '../src/config'

describe('line', () => {
    new CSSTester(config, null)
        .classText({
            'bb:lightest': 'border-bottom-color:var(--color-line-lightest)',
        })
})
