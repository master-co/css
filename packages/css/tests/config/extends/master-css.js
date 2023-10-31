/** @type {import('../../../src').Config} */
const config = {
    extends: [
        require('./master-1.css'),
        require('./master-2.css')
    ],
    variables:  {
        first: {
            '@dark': '$(blue-80)'
        },
        second: {
            '@dark': '$(blue-30)'
        },
        third: {
            '': '$(blue-30)'
        },
        fourth: {
            '@dark': '$(blue-50)'
        }
    }
}

module.exports = {
    config
}
