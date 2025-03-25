import { it, test, expect } from 'vitest'
import { MasterCSS } from '../src'
import shuffle from 'shuffle-array'

/** [':disabled', ':active', ':focus', ':hover'] */
it.concurrent('checks the ordering of state selectors', () => {
    expect(new MasterCSS().add('block:disabled', 'block:hover', 'block:active', 'block:focus').generalLayer.rules)
        .toMatchObject([
            { name: 'block:hover' },
            { name: 'block:focus' },
            { name: 'block:active' },
            { name: 'block:disabled' }
        ])
})

it.concurrent('checks the ordering of state selectors, and @media', () => {
    const expected = [
        'block',
        'block:hover',
        'block:focus',
        'block:active',
        'block:disabled',
        'block@screen',
        'block:hover@screen',
        'block:focus@print',
        'block:active@screen',
        'block:disabled@print',
        'block@sm',
        'block@md',
        'block@>sm&<md',
        'block:hover@sm',
        'block:focus@sm',
        'block:active@sm',
        'block:disabled@sm',
        'block:hover@md',
        'block:focus@md',
        'block:active@md',
        'block:disabled@md'
    ]

    for (let i = 0; i < 10; i++) {
        expect(new MasterCSS().add(...shuffle([...expected])).generalLayer.rules.map(rule => rule.name))
            .toEqual(expected)
    }
})