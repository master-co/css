test('styles', () => {
    expect(new MasterCSS({
        styles: {
            '?': 'font:14 text:center h:40 px:20 fg:#fff:hover'
        }
    }).add('?').text).toBe(
        '.px\\:20,.\\?{padding-left:1.25rem;padding-right:1.25rem}' +
        '.font\\:14,.\\?{font-size:0.875rem}' +
        '.h\\:40,.\\?{height:2.5rem}' +
        '.text\\:center,.\\?{text-align:center}' +
        '.fg\\:\\#fff\\:hover:hover,.\\?:hover{color:#fff}'
    )
})

test('viewports', () => {
    expect(new MasterCSS({
        queries: {
            'xss': 500
        }
    }).add('hidden@xss').text).toBe(
        '@media (min-width:500px){.hidden\\@xss{display:none}}'
    )
})

test('colors', () => {
    expect(new MasterCSS({
        variables: {
            newColor: {
                '': '#63697c',
                10: '#131518',
                50: '#63697c',
                90: '#f4f4f6'
            }
        }
    }).add('fg:newColor').text).toBe(
        '.fg\\:newColor{color:rgb(99 105 124)}'
    )
})

test('queries', () => {
    expect(new MasterCSS({
        queries: {
            'min-600': 'media (min-width: 600px)'
        }
    }).add('f:12@min-600').text).toBe(
        '@media (min-width: 600px){.f\\:12\\@min-600{font-size:0.75rem}}'
    )
})

test('animations', () => {
    expect(new MasterCSS({
        variables: {
            float: '#000000'
        },
        animations: {
            float: {
                '0%': { transform: 'none' },
                '50%': { transform: 'translateY(-1.25rem)' },
                to: { transform: 'none' }
            },
        }
    }).add('@float|.5s').text).toBe(
        '@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}.\\@float\\|\\.5s{animation:float .5s}'
    )
})