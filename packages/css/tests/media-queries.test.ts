import { testCSS } from './css'
import { config } from '../../../master.css.js'

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
        'hide@supports(transform-origin:5%_5%)',
        '@supports (transform-origin:5% 5%){.hide\\@supports\\(transform-origin\\:5\\%_5\\%\\){display:none}}',
        config
    )
})
