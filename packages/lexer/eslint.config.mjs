import common from '../../eslint.config.mjs'

export default [
    ...common,
    {
        rules: {
            'no-undef': 'off'
        }
    }
]
