import shuffle from 'shuffle-array'

/** [':disabled', ':active', ':focus', ':hover'] */
it('checks the ordering of state selectors', () => {
    expect(new MasterCSS().add('block:disabled', 'block:hover', 'block:active', 'block:focus').rules)
        .toMatchObject([
            { className: 'block:hover' },
            { className: 'block:focus' },
            { className: 'block:active' },
            { className: 'block:disabled' }
        ])
})

it('checks the ordering of state selectors, :where(), and @media', () => {
    const expected = [
        // :where()
        { className: 'block:where(button)' },

        // normal
        { className: 'block' },

        // :where() selector
        { className: 'block:where(button):hover' },
        { className: 'block:where(button):focus' },
        { className: 'block:where(button):active' },
        { className: 'block:where(button):disabled' },

        // normal selector
        { className: 'block:hover' },
        { className: 'block:focus' },
        { className: 'block:active' },
        { className: 'block:disabled' },

        // @media :where()
        { className: 'block:where(button)@print' },

        // @media
        { className: 'block@screen' },

        // @media :where() selector
        { className: 'block:where(button):hover@screen' },
        { className: 'block:where(button):focus@print' },
        { className: 'block:where(button):active@screen' },
        { className: 'block:where(button):disabled@print' },

        // @media selector
        { className: 'block:hover@screen' },
        { className: 'block:focus@print' },
        { className: 'block:active@screen' },
        { className: 'block:disabled@print' },

        // @media width :where()
        // @media width
        { className: 'block:where(button)@sm' },
        { className: 'block@sm' },
        { className: 'block:where(button)@md' },
        { className: 'block@md' },
        { className: 'block:where(button)@>sm&<md' },
        { className: 'block@>sm&<md' },

        // @media width :where() selector
        // @media width selector
        { className: 'block:where(button):hover@sm' },
        { className: 'block:where(button):focus@sm' },
        { className: 'block:where(button):active@sm' },
        { className: 'block:where(button):disabled@sm' },
        { className: 'block:hover@sm' },
        { className: 'block:focus@sm' },
        { className: 'block:active@sm' },
        { className: 'block:disabled@sm' },
        { className: 'block:where(button):hover@md' },
        { className: 'block:where(button):focus@md' },
        { className: 'block:where(button):active@md' },
        { className: 'block:where(button):disabled@md' },
        { className: 'block:hover@md' },
        { className: 'block:focus@md' },
        { className: 'block:active@md' },
        { className: 'block:disabled@md' }
    ]

    for (let i = 0; i < 10; i++) {
        expect(new MasterCSS().add(...shuffle([...expected.map((({ className }) => className))])).rules)
            .toMatchObject(expected)
    }
})