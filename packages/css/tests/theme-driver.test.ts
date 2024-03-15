import config from './config'

test('modeDriver', () => {
    expect(new MasterCSS({ ...config, modeDriver: 'media' }).add('fg:primary').text).toBe(':root{--primary:0 0 0}@media(prefers-color-scheme:light){:root{--primary:0 0 0}}@media(prefers-color-scheme:dark){:root{--primary:255 255 255}}.fg\\:primary{color:rgb(var(--primary))}',)
    expect(new MasterCSS({
        variables: {
            fade: {
                '@light': '#cccccc',
                '@dark': '#333333'
            }
        },
        modeDriver: 'media'
    }).add('{block;fg:fade}_:where(p)_code:before').text).toBe('@media(prefers-color-scheme:light){:root{--fade:204 204 204}}@media(prefers-color-scheme:dark){:root{--fade:51 51 51}}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}')
    expect(new MasterCSS({ ...config, modeDriver: 'host' }).add('fg:primary')?.text).toBe(':root{--primary:0 0 0}:host(.light){--primary:0 0 0}:host(.dark){--primary:255 255 255}.fg\\:primary{color:rgb(var(--primary))}')
    expect(new MasterCSS({
        variables: {
            fade: {
                '@light': '#cccccc',
                '@dark': '#333333'
            }
        },
        modeDriver: 'host'
    }).add('{block;fg:fade}_:where(p)_code:before').text).toBe(':host(.light){--fade:204 204 204}:host(.dark){--fade:51 51 51}.\\{block\\;fg\\:fade\\}_\\:where\\(p\\)_code\\:before :where(p) code:before{display:block;color:rgb(var(--fade))}')
})

