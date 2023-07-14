const config = {
    extends: [
        require('./master-1-1.css'),
        require('./master-1-2.css'),
    ],
    colors: {
        first: '#111111 #222222@dark rgb(0, 0, 0)@light',
        second: '#999999@dark rgba(0 0 0/.5)@light',
        third: {
            '': 'blue-50@dark',
            '2': {
                '@dark': 'blue-60'
            }
        }
    },
    classes: {
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
