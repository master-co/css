import { describe } from 'node:test'
import CSSTester from './tester'

describe('line', () => {
    new CSSTester()
        .classText({
            'bb:lightest': 'border-bottom-color:var(--color-line-lightest)',
        })
})
