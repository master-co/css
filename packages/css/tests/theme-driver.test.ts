import config from './config'

test('themeDriver', () => {
    expect(new MasterCSS({ ...config, themeDriver: 'media' }).add('fg:primary').text).toBe(':root{--primary:23 95 233}@media(prefers-color-scheme:light){:root{--primary:235 187 64}}@media(prefers-color-scheme:dark){:root{--primary:251 224 157}}.fg\\:primary{color:rgb(var(--primary))}',)
    expect(new MasterCSS({
        variables: {
            fade: {
                '@light': '#cccccc',
                '@dark': '#333333'
            }
        },
        themeDriver: 'media'
    }).add('{block;fg:fade}_:where(p)_code:before').text).toBe('@media(prefers-color-scheme:light){:root{--fade:204 204 204}}@media(prefers-color-scheme:dark){:root{--fade:51 51 51}}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}')
    expect(new MasterCSS({ ...config, themeDriver: 'host' }).add('fg:primary')?.text).toBe(':root{--primary:23 95 233}:host(.light){--primary:235 187 64}:host(.dark){--primary:251 224 157}.fg\\:primary{color:rgb(var(--primary))}')
    expect(new MasterCSS({
        variables: {
            fade: {
                '@light': '#cccccc',
                '@dark': '#333333'
            }
        },
        themeDriver: 'host'
    }).add('{block;fg:fade}_:where(p)_code:before').text).toBe(':host(.light){--fade:204 204 204}:host(.dark){--fade:51 51 51}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}')
})

