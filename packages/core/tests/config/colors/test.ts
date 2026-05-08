import { it, test } from 'vitest'

import config from '../../config'
import { expectLayers } from '../../test'

test.concurrent('colors', () => {
    expectLayers(
        {
            theme: ':root{--color-primary-stage-1:oklch(100% 0 none)}.light{--color-primary-stage-1:oklch(0% 0 none)}.dark{--color-primary-stage-1:oklch(100% 0 none)}',
            utilities: '.fg\\:primary-stage-1{color:var(--color-primary-stage-1)}'
        },
        'fg:primary-stage-1',
        config
    )

    expectLayers(
        {
            utilities: '.b\\:input{border-color:rgb(18 52 86)}'
        },
        'b:input',
        config
    )

    expectLayers(
        {
            utilities: '.bg\\:blue-100{background-color:oklch(25.46% 0.168 269.2)}'
        },
        'bg:blue-100',
        { variables: [{ key: 'blue-100', value: '#777' }] }
    )

    expectLayers(
        {
            utilities: '.bg\\:primary-alpha{background-color:oklch(100% 0 none/0.1)}'
        },
        'bg:primary-alpha',
        config
    )

    expectLayers(
        {
            utilities: '.bg\\:primary-rgb1{background-color:rgb(0 0 0)}'
        },
        'bg:primary-rgb1',
        config
    )

    expectLayers(
        {
            utilities: '.bg\\:primary-rgb2{background-color:oklch(0% 0 none)}'
        },
        'bg:primary-rgb2',
        config
    )

    expectLayers(
        {
            utilities: '.bg\\:primary-rgb3{background-color:rgb(0 0 0/0.5)}'
        },
        'bg:primary-rgb3',
        config
    )

    expectLayers(
        {
            utilities: '.bg\\:primary-2{background-color:rgb(0 0 0/0.35)}'
        },
        'bg:primary-2',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--color-major:oklch(0% 0 none)}.dark{--color-major:oklch(100% 0 none)}',
            utilities: '.bg\\:linear-gradient\\(180deg\\,major\\,black\\){background-image:linear-gradient(180deg,var(--color-major),oklch(0% 0 none))}'
        },
        'bg:linear-gradient(180deg,major,black)',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}.light,:root{--accent:rgb(17 17 17)}.dark{--accent:rgb(238 238 238)}',
            utilities: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),var(--accent))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        { variables: [{ key: 'primary', value: '#000000', mode: 'light' }, { key: 'accent', value: '#111111', mode: 'light' }, { key: 'primary', value: '#ffffff', mode: 'dark' }, { key: 'accent', value: '#eeeeee', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}.dark{--accent:rgb(238 238 238)}',
            utilities: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),var(--accent))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        { variables: [{ key: 'primary', value: '#000000', mode: 'light' }, { key: 'primary', value: '#ffffff', mode: 'dark' }, { key: 'accent', value: '#eeeeee', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}',
            utilities: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),accent)}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        { variables: [{ key: 'primary', value: '#000000', mode: 'light' }, { key: 'primary', value: '#ffffff', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    expectLayers(
        {
            theme: '.light,:root{--primary:rgb(0 0 0)}.dark{--primary:rgb(255 255 255)}:root{--accent:rgb(255 0 0)}.dark{--accent:rgb(170 0 0)}',
            utilities: '.bg\\:linear-gradient\\(180deg\\,primary\\,accent\\){background-image:linear-gradient(180deg,var(--primary),var(--accent))}'
        },
        'bg:linear-gradient(180deg,primary,accent)',
        { variables: [{ key: 'accent', value: '#ff0000' }, { key: 'primary', value: '#000000', mode: 'light' }, { key: 'primary', value: '#ffffff', mode: 'dark' }, { key: 'accent', value: '#aa0000', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    expectLayers(
        {
            theme: '.light,:root{--fade:rgb(204 204 204)}.dark{--fade:rgb(51 51 51)}',
            utilities: '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:var(--fade)}'
        },
        '{block;fg:fade}_:where(p)_code:before',
        { variables: [{ key: 'fade', value: '#cccccc', mode: 'light' }, { key: 'fade', value: '#333333', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class' }
    )

    expectLayers(
        { theme: ':root{--color-primary-filled:oklch(0% 0 none)}.light{--color-primary-filled:oklch(100% 0 none)}.dark{--color-primary-filled:oklch(0% 0 none)}', components: '.btn{background-color:var(--color-primary-filled)}' },
        'btn',
        { variables: [{ namespace: 'color', key: 'primary-filled', value: '$color-black' }, { namespace: 'color', key: 'primary-filled', value: '$color-white', mode: 'light' }, { namespace: 'color', key: 'primary-filled', value: '$color-black', mode: 'dark' }], modes: ['light', 'dark'], modeTrigger: 'class', utilities: [
            {
                name: 'btn',
                type: -4,
                layer: 'main',
                rules: [
                    { selector: '&', declarations: { 'background-color': 'var(--color-primary-filled)' } }
                ]
            }
        ] }
    )

    expectLayers(
        {
            theme: ':root{--color-primary-filled:oklch(0% 0 none)}.light{--color-primary-filled:oklch(100% 0 none)}.dark{--color-primary-filled:oklch(0% 0 none)}',
            utilities: '.bg\\:primary-filled{background-color:var(--color-primary-filled)}'
        },
        'bg:primary-filled',
        { variables: [{ namespace: 'color', key: 'primary-filled', value: '$color-black' }, { namespace: 'color', key: 'primary-filled', value: '$color-white', mode: 'light' }, { namespace: 'color', key: 'primary-filled', value: '$color-black', mode: 'dark' }], modes: ['light', 'dark'], utilities: [
            {
                name: 'btn',
                type: -4,
                layer: 'main',
                rules: [
                    { selector: '&', declarations: { 'background-color': 'var(--color-primary-filled)' } }
                ]
            }
        ], modeTrigger: 'class' }
    )

    expectLayers(
        {
            utilities: '.dark .bg\\:primary-filled\\@dark{background-color:oklch(100% 0 none)}'
        },
        'bg:primary-filled@dark',
        { variables: [{ namespace: 'color', key: 'primary-filled', value: '$color-white' }, { namespace: 'color', key: 'primary-filled', value: '$color-black', mode: 'light' }, { namespace: 'color', key: 'primary-filled', value: '$color-white', mode: 'dark' }], modes: ['light', 'dark'], utilities: [
            {
                name: 'btn',
                type: -4,
                layer: 'main',
                rules: [
                    { selector: '&', declarations: { 'background-color': 'var(--color-primary-filled)' } }
                ]
            }
        ], modeTrigger: 'class' }
    )

    expectLayers(
        {
            theme: '.light,:root{--color-code:oklch(0% 0 none)}.dark{--color-code:oklch(100% 0 none)}',
            utilities: '.bg\\:code{background-color:var(--color-code)}'
        },
        'bg:code',
        config
    )

    expectLayers(
        {
            theme: '.light,:root{--color-code:oklch(0% 0 none)}.dark{--color-code:oklch(100% 0 none)}',
            utilities: '.bg\\:code\\/\\.5{background-color:color-mix(in oklab,var(--color-code) 50%,transparent)}'
        },
        'bg:code/.5',
        config
    )

})

it.concurrent('checks if similar color names collide.', () => {
    expectLayers(
        {
            utilities: '.fg\\:a-1{color:oklch(0 0 0)}'
        },
        'fg:a-1',
        { variables: [{ namespace: 'a', key: '1', value: 'oklch(0 0 0)' }, { namespace: 'aa', key: '1', value: 'oklch(1 0 0)' }] }
    )
})
