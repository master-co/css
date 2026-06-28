import common from '../../eslint.config.js'

export default [
    ...common,
    {
        rules: {
            'no-undef': 'off',
        }
    }
]
