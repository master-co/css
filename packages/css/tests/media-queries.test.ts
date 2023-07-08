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
        '.christmas .fg\\:red\\@christmas{color:#d11a1e}',
        config
    )
    testCSS(
        'fg:red@christmas&md',
        '@media (min-width:1024px){.fg\\:red\\@christmas\\&md{color:#d11a1e}}',
        config
    )
    testCSS(
        'fg:red@christmas@md',
        '@media (min-width:1024px){.christmas .fg\\:red\\@christmas\\@md{color:#d11a1e}}',
        config
    )
})
