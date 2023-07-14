/** @type {import('../../../src').Config} */
const config = {
    extends: [
        require('./master-1.css'),
        require('./master-2.css')
    ],
    colors:  {
        first: {
            '@dark': 'blue-80'
        },
        second: 'blue-30@dark',
        third: {
            '': 'blue-30'
        }
    }
}

module.exports = {
    config
}
