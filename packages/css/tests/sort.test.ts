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
      
        // normal
        'block',

        // :where() selector
        'block:where(button):hover',
        'block:where(button):focus',
        'block:where(button):active',
        'block:where(button):disabled',

        // normal selector
        'block:hover',
        'block:focus',
        'block:active',
        'block:disabled',

        // @media :where()
        'block:where(button)@print',

        // @media
        'block@screen',

        // @media :where() selector
        'block:where(button):hover@screen',
        'block:where(button):focus@print',
        'block:where(button):active@screen',
        'block:where(button):disabled@print',

        // @media selector
        'block:hover@screen',
        'block:focus@print',
        'block:active@screen',
        'block:disabled@print',

        // @media width :where()
        // @media width
        'block:where(button)@sm',
        'block@sm',
        'block:where(button)@md',
        'block@md',
        'block:where(button)@>sm&<md',
        'block@>sm&<md',

        // @media width :where() selector
        // @media width selector
        'block:where(button):hover@sm',
        'block:where(button):focus@sm',
        'block:where(button):active@sm',
        'block:where(button):disabled@sm',
        'block:hover@sm',
        'block:focus@sm',
        'block:active@sm',
        'block:disabled@sm',
        'block:where(button):hover@md',
        'block:where(button):focus@md',
        'block:where(button):active@md',
        'block:where(button):disabled@md',
        'block:hover@md',
        'block:focus@md',
        'block:active@md',
        'block:disabled@md',
    ]
   
    for (let i = 0; i < 10; i++) {
        expectOrderOfRules(shuffle([...expected]), expected)
    }
})