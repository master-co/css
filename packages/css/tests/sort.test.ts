import { expectOrderOfRules } from './css'
import shuffle from 'shuffle-array'

/** [':disabled', ':active', ':focus', ':hover'] */
it('checks the ordering of state selectors', () => {
    expectOrderOfRules(
        ['block:disabled', 'block:hover', 'block:active', 'block:focus'],
        ['block:hover', 'block:focus', 'block:active', 'block:disabled']
    )
})

it('checks the ordering of state selectors, :where(), and @media', () => {
    const expected = [
        // :where()
        'block:where(button)',
        'block:where(button):hover',
        'block:where(button):focus',
        'block:where(button):active',
        'block:where(button):disabled',
        //
        'block',
        'block:hover',
        'block:focus',
        'block:active',
        'block:disabled',
        // @media :where()
        'block:where(button)@sm',
        'block:where(button):hover@sm',
        'block:where(button):focus@sm',
        'block:where(button):active@sm',
        'block:where(button):disabled@sm',
        // @media
        'block@sm',
        'block:hover@sm',
        'block:focus@sm',
        'block:active@sm',
        'block:disabled@sm',
    ]
    for (let i = 0; i < 10; i++) {
        expectOrderOfRules(shuffle(expected), expected)
    }
})