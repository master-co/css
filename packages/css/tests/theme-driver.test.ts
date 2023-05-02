import { testCSS } from './css'
import { config } from '../../../master.css.js'

test('themeDriver', () => {
    testCSS(
        'fg:primary',
        '.fg\\:primary,.btn,.blue-btn{color:#175fe9}@media(prefers-color-scheme:light){.fg\\:primary,.blue-btn{color:#ebbb40}}@media(prefers-color-scheme:dark){.fg\\:primary,.btn,.blue-btn{color:#fbe09d}}',
        { ...config, themeDriver: 'media' }
    )
    testCSS(
        '{block;fg:fade}_:where(p)_code:before',
        '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block}@media(prefers-color-scheme:light){.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{.fg\\:fade{color:#cccccc}}}@media(prefers-color-scheme:dark){.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{.fg\\:fade{color:#333333}}}',
        {
            themes: {
                light: { colors: { fade: '#cccccc' } },
                dark: { colors: { fade: '#333333' } }
            },
            themeDriver: 'media'
        }
    )
    testCSS(
        'fg:primary',
        '.fg\\:primary,:host(.dark) .btn,.blue-btn{color:#175fe9}:host(.light) .fg\\:primary,:host(.light) .blue-btn{color:#ebbb40}:host(.dark) .fg\\:primary,:host(.dark) .btn,:host(.dark) .blue-btn{color:#fbe09d}',
        { ...config, themeDriver: 'host' }
    )
    testCSS(
        '{block;fg:fade}_:where(p)_code:before',
        '.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block}:host(.light) .\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{color:#cccccc}:host(.dark) .\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{color:#333333}',
        {
            themes: {
                light: { colors: { fade: '#cccccc' } },
                dark: { colors: { fade: '#333333' } }
            },
            themeDriver: 'host'
        }
    )
})

