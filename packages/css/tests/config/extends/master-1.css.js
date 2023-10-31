const config = {
    extends: [
        require('./master-1-1.css'),
        require('./master-1-2.css'),
    ],
    variables: {
        fourth: '$(first)',
        first: {
            '': '#111111',
            '@dark': '#222222',
            '@light': 'rgb(0, 0, 0)'
        },
        second: {
            '@dark': '#999999',
            '@light': 'rgb(0 0 0 / .5)'
        },
        third: {
            '@dark': '$(blue-50)',
            '2': {
                '@dark': '$(blue-60)'
            }
        }
    },
    styles: {
        btn: 'font:14 h:40 text:center',
        blue: {
            btn: {
                '': 'btn bg:blue'
            }
        }
    }
}

module.exports = {
    config
}
