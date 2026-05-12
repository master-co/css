import { it, test } from 'vitest'

import config from '../../config'
import { expectLayers } from '../../test'

test.concurrent('colors use CSS variable references and grouped theme output', () => {
    expectLayers(
        {
            theme: ':root{--color-primary-stage-1:var(--color-white);--color-white:oklch(100% 0 none);--color-black:oklch(0% 0 none)}.light{--color-primary-stage-1:var(--color-black)}.dark{--color-primary-stage-1:var(--color-white)}',
            utilities: '.fg\\:primary-stage-1{color:var(--color-primary-stage-1)}'
        },
        'fg:primary-stage-1',
        config
    )

    expectLayers(
        {
            theme: ':root{--color-primary-alpha:color-mix(in oklab,var(--color-white) 10%,transparent);--color-white:oklch(100% 0 none)}',
            utilities: '.bg\\:primary-alpha{background-color:var(--color-primary-alpha)}'
        },
        'bg:primary-alpha',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--color-major:var(--color-black)}.dark{--color-major:var(--color-white)}:root{--color-black:oklch(0% 0 none);--color-white:oklch(100% 0 none)}',
            utilities: '.bg\\:linear-gradient\\(180deg\\,major\\,black\\){background-image:linear-gradient(180deg,var(--color-major),var(--color-black))}'
        },
        'bg:linear-gradient(180deg,major,black)',
        config
    )
})

it.concurrent('checks if similar color names collide.', () => {
    expectLayers(
        {
            theme: ':root{--a-1:oklch(0 0 0)}',
            utilities: '.fg\\:a-1{color:var(--a-1)}'
        },
        'fg:a-1',
        { variables: [{ namespace: 'a', key: '1', value: 'oklch(0 0 0)' }, { namespace: 'aa', key: '1', value: 'oklch(1 0 0)' }] }
    )
})
