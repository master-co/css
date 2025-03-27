import { it, test, expect } from 'vitest'
import { MasterCSS } from '../../../src'
import config from '../../config'
import { expectLayers } from '../../test'

test.concurrent('orientation', () => {
    expectLayers(
        {
            general: '@media (orientation:landscape){.hidden\\@landscape{display:none}}'
        },
        'hidden@landscape',
        config
    )

    expectLayers(
        {
            general: '@media (orientation:portrait){.hidden\\@portrait{display:none}}'
        },
        'hidden@portrait',
        config
    )
})

test.concurrent('prefers-reduced-motion', () => {
    expectLayers(
        {
            general: '@media (prefers-reduced-motion:no-preference){.hidden\\@motion{display:none}}'
        },
        'hidden@motion',
        config
    )

    expectLayers(
        {
            general: '@media (prefers-reduced-motion:reduce){.hidden\\@reduce-motion{display:none}}'
        },
        'hidden@reduce-motion',
        config
    )
})

test.concurrent('mixed', () => {
    expectLayers(
        {
            general: '@media (prefers-reduced-motion:no-preference) and (orientation:landscape){.hidden\\@motion\\&landscape{display:none}}'
        },
        'hidden@motion&landscape',
        config
    )
})

test.concurrent('at', () => {
    expectLayers(
        {
            general: '@media (max-device-width:42mm) and (min-device-width:38mm){.hidden\\@watch{display:none}}'
        },
        'hidden@watch',
        config
    )

    expectLayers(
        {
            general: '@media (max-device-width:42mm) and (min-device-width:38mm){.hidden\\@device-watch{display:none}}'
        },
        'hidden@device-watch',
        config
    )

    expectLayers(
        {
            general: '@media (max-device-width:42mm) and (min-device-width:38mm){.hidden\\@device-watch{display:none}}'
        },
        'hidden@device-watch',
        config
    )

    expectLayers(
        {
            general: '@supports (transform-origin:5% 5%){.hidden\\@supports\\(transform-origin\\:5\\%\\|5\\%\\){display:none}}'
        },
        'hidden@supports(transform-origin:5%|5%)',
        config
    )

    expectLayers(
        {
            general: '.christmas .fg\\:black\\@christmas{color:rgb(0 0 0)}'
        },
        'fg:black@christmas',
        { ...config, modes: { christmas: 'class' }}
    )

    expectLayers(
        {
            general: '@media (width>=64rem){.christmas .fg\\:black\\@christmas\\@md{color:rgb(0 0 0)}}'
        },
        'fg:black@christmas@md',
        { ...config, modes: { christmas: 'class' }}
    )
})

test.concurrent('viewports', () => {
    expectLayers(
        {
            general: '@media (width>=48rem){.hidden\\@tablet{display:none}}'
        },
        'hidden@tablet',
        config
    )

    expectLayers(
        {
            general: '@media (width>=64rem){.hidden\\@laptop{display:none}}'
        },
        'hidden@laptop',
        config
    )

    expectLayers(
        {
            general: '@media (width>=80rem){.hidden\\@desktop{display:none}}'
        },
        'hidden@desktop',
        config
    )

    expectLayers(
        {
            general: '@media (width>=156.25rem){.hidden\\@custom-1{display:none}}'
        },
        'hidden@custom-1',
        config
    )
})