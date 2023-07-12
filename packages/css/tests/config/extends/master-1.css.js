const config = {
    extends: [
        require('./master-1-1.css'),
        require('./master-1-2.css'),
    ],
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
