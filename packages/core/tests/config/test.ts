import { expect, test } from 'vitest'

import { createCSS, UtilityType } from '../../src'
import createCSSWithTheme from '../helpers/create-css-with-theme'
import { expectLayers } from '../test'

test.concurrent('default config excludes theme tokens', () => {
    const css = createCSS()
    expect(css.config).toMatchObject({
        defaultMode: 'light',
        modeTrigger: 'media',
        modes: ['light', 'dark']
    })
    expect(css.create('fg:black')?.text).toContain('color:black')
    expect(createCSSWithTheme().create('fg:black')?.text).toContain('color:var(--color-black)')
})

test.concurrent('components', () => {
    expectLayers(
        { components: '.\\?{padding-left:1.25rem;padding-right:1.25rem}.\\?{font-size:0.875rem}.\\?{height:2.5rem}.\\?{text-align:center}.\\?:hover{color:#fff}' },
        '?',
        {
            utilities: [
                {
                    name: '?',
                    type: UtilityType.Static,
                    layer: 'components',
                    rules: [
                        { selector: '&', declarations: { 'padding-left': '1.25rem', 'padding-right': '1.25rem' } },
                        { selector: '&', declarations: { 'font-size': '0.875rem' } },
                        { selector: '&', declarations: { height: '2.5rem' } },
                        { selector: '&', declarations: { 'text-align': 'center' } },
                        { selector: '&:hover', declarations: { color: '#fff' } }
                    ]
                }
            ]
        }
    )
})

test.concurrent('viewports', () => {
    expectLayers(
        {
            utilities: '@media (width>=31.25rem){.hidden\\@xss{display:none}}'
        },
        'hidden@xss',
        { variants: [{ token: '@xss', branches: [{ atRules: ['@media (width>=500)'] }] }] }
    )
})

test.concurrent('variant tokens share mode and condition namespaces', () => {
    expect(() => createCSS({ variants: [{ token: '@dark', branches: [{ atRules: ['@media (color)'] }] }] }))
        .toThrow('Variant "dark" conflicts with mode "dark"')
    expect(() => createCSS({
        variables: [{ namespace: 'container', key: 'card', value: 320 }],
        variants: [{ token: '@card', branches: [{ atRules: ['@media (width>=20rem)'] }] }]
    })).toThrow('Variant "card" conflicts with container variable "--container-card"')
})

test.concurrent('selector variant branches require explicit caller slot', () => {
    expect(() => createCSS({ variants: [{ token: ':child', branches: [{ selector: ' .child' }] }] }))
        .toThrow('Variant ":child" selector branch must include "&"')
})

test.concurrent('colors', () => {
    expectLayers(
        {
            utilities: '.fg\\:newColor{color:var(--newColor)}'
        },
        'fg:newColor',
        { variables: [
        { key: 'newColor', value: '#63697c' },
        { namespace: 'newColor', key: '10', value: '#131518' },
        { namespace: 'newColor', key: '50', value: '#63697c' },
        { namespace: 'newColor', key: '90', value: '#f4f4f6' }
    ] }
    )
})

test.concurrent('at', () => {
    expectLayers(
        {
            utilities: '@media (width>=37.5rem){.f\\:12\\@min-600{font-size:0.75rem}}'
        },
        'f:12@min-600',
        { variants: [{ token: '@min-600', branches: [{ atRules: ['@media(width>=600)'] }] }] }
    )
})

test.concurrent('animations', () => {
    expectLayers(
        {
            utilities: '.animation\\:float\\|\\.5s{animation:float 0.5s}',
            animations: '@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}'
        },
        'animation:float|.5s',
        { variables: [{ key: 'float', value: '#000000' }], animations: {
                float: {
                    '0%': { transform: 'none' },
                    '50%': { transform: 'translateY(-1.25rem)' },
                    to: { transform: 'none' }
                },
            } }
    )
})
