import { testCSS } from './css'
import config from './master.css'

test('themeDriver', () => {
    testCSS(
        'fg:primary',
        '.fg\\:primary{color:#175fe9}@media(prefers-color-scheme:dark){.fg\\:primary{color:#fbe09d}}@media(prefers-color-scheme:light){.fg\\:primary{color:#ebbb40}}',
        { ...config, themeDriver: 'media' }
    )
    testCSS(
        '{block;fg:fade}_:where(p)_code:before',
        '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block}@media(prefers-color-scheme:light){.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{.fg\\:fade{color:#cccccc}}}@media(prefers-color-scheme:dark){.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{.fg\\:fade{color:#333333}}}',
        {
            colors: {
                fade: {
                    '@light': '#cccccc',
                    '@dark': '#333333'
                }
            },
            themeDriver: 'media'
        }
    )
    testCSS(
        'fg:primary',
        '.fg\\:primary{color:#175fe9}:host(.dark) .fg\\:primary{color:#fbe09d}:host(.light) .fg\\:primary{color:#ebbb40}',
        { ...config, themeDriver: 'host' }
    )
    testCSS(
        '{block;fg:fade}_:where(p)_code:before',
        '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block}:host(.light) .\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{color:#cccccc}:host(.dark) .\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{color:#333333}',
        {
            colors: {
                fade: {
                    '@light': '#cccccc',
                    '@dark': '#333333'
                }
            },
            themeDriver: 'host'
        }
    )
})

