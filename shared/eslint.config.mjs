import common from '../eslint.config.mjs'
import eslintConfigTechor from 'eslint-config-techor'

export default [
    ...common,
    eslintConfigTechor.configs.typescript
]