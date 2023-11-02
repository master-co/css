import { testCSS } from './css'
import config from './config'

test('mediaQueries', () => {
    testCSS(
        'hide@watch',
        '@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@watch{display:none}}',
        config
    )
    testCSS(
        'hide@device-watch',
        '@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@device-watch{display:none}}',
        config
    )
    testCSS(
        'hide@device-watch',
        '@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@device-watch{display:none}}',
        config
    )
    testCSS(
        'hide@supports(transform-origin:5%|5%)',
        '@supports (transform-origin:5% 5%){.hide\\@supports\\(transform-origin\\:5\\%\\|5\\%\\){display:none}}',
        config
    )
    testCSS(
        'fg:red@christmas',
        '.christmas .fg\\:red\\@christmas{color:rgb(209 26 30)}',
        config
    )
    testCSS(
        'fg:red@christmas&md',
        '@media (min-width:1024px){.fg\\:red\\@christmas\\&md{color:rgb(209 26 30)}}',
        config
    )
    testCSS(
        'fg:red@christmas@md',
        '@media (min-width:1024px){.christmas .fg\\:red\\@christmas\\@md{color:rgb(209 26 30)}}',
        config
    )
})

test('viewports', () => {
    testCSS(
        'hide@tablet',
        '@media (min-width:768px){.hide\\@tablet{display:none}}',
        config
    )
    testCSS(
        'hide@laptop',
        '@media (min-width:1024px){.hide\\@laptop{display:none}}',
        config
    )
    testCSS(
        'hide@desktop',
        '@media (min-width:1280px){.hide\\@desktop{display:none}}',
        config
    )
    testCSS(
        'hide@custom-1',
        '@media (min-width:2500px){.hide\\@custom-1{display:none}}',
        config
    )
})
