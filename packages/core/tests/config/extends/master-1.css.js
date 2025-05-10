import config1 from './master-1-1.css'
import config2 from './master-1-2.css'

const config = {
    extends: [
        config1,
        config2,
    ],
    variables: {
        fourth: '$first',
        first: '#111111'
    },
    modes: {
        light: {
            first: 'rgb(0, 0, 0)',
            second: 'rgb(0 0 0 / .5)',
        },
        dark: {
            first: '#222222',
            second: '#999999',
            third: '$white',
            'third-2': '$white'
        }
    },
    components: {
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
