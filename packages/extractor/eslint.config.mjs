import common from '../../eslint.config.mjs'
import techor from 'eslint-config-techor'

export default [
    techor.configs.typescript,
    ...common,
    {
        rules: {
            'no-undef': 'off'
        }
    }
]