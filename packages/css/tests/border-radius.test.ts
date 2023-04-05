import { testProp } from './css'

it('validate output border-radius rules', () => {
    testProp('r:16', 'border-radius:1rem')
    testProp('border-radius:1rem')

    testProp('rtl:16', 'border-top-left-radius:1rem')
    testProp('rlt:16', 'border-top-left-radius:1rem')
    testProp('rtr:16', 'border-top-right-radius:1rem')
    testProp('rrt:16', 'border-top-right-radius:1rem')

    testProp('rbl:16', 'border-bottom-left-radius:1rem')
    testProp('rlb:16', 'border-bottom-left-radius:1rem')
    testProp('rbr:16', 'border-bottom-right-radius:1rem')
    testProp('rrb:16', 'border-bottom-right-radius:1rem')

    testProp('rt:16', 'border-top-left-radius:1rem;border-top-right-radius:1rem')
    testProp('rb:16', 'border-bottom-left-radius:1rem;border-bottom-right-radius:1rem')
    testProp('rl:16', 'border-top-left-radius:1rem;border-bottom-left-radius:1rem')
    testProp('rr:16', 'border-top-right-radius:1rem;border-bottom-right-radius:1rem')
})