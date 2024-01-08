/** @type {import('../../../src').Config} */
const config = {
    extends: [
        require('./master-1.css'),
        require('./master-2.css')
    ],
    variables:  {
        first: {
            '@dark': '$(black)'
        },
        second: {
            '@dark': '$(black)'
        },
        third: {
            '': '$(black)'
        },
        fourth: {
            '@dark': '$(black)'
        }
    }
}

module.exports = {
    config
}
