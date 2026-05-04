import common from '../../eslint.config.mjs'
import techor from 'eslint-config-techor'

export default [
    ...common,
    techor.configs.typescript,
]
