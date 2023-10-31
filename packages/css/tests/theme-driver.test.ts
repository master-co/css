import { testCSS } from './css'
import config from './config'

test('themeDriver', () => {
    testCSS(
        'fg:primary',
        '@media(prefers-color-scheme:light){--primary:235 187 64}@media(prefers-color-scheme:dark){--primary:251 224 157}:root{--primary:23 95 233}.fg\\:primary{color:rgb(var(--primary))}',
        { ...config, themeDriver: 'media' }
    )
    testCSS(
        '{block;fg:fade}_:where(p)_code:before',
        '@media(prefers-color-scheme:light){--fade:204 204 204}@media(prefers-color-scheme:dark){--fade:51 51 51}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}',
        {
            variables: {
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
        ':host(.light){--primary:235 187 64}:host(.dark){--primary:251 224 157}:root{--primary:23 95 233}.fg\\:primary{color:rgb(var(--primary))}',
        { ...config, themeDriver: 'host' }
    )
    testCSS(
        '{block;fg:fade}_:where(p)_code:before',
        ':host(.light){--fade:204 204 204}:host(.dark){--fade:51 51 51}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}',
        {
            variables: {
                fade: {
                    '@light': '#cccccc',
                    '@dark': '#333333'
                }
            },
            themeDriver: 'host'
        }
    )
})

