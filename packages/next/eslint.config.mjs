import common from '../../eslint.config.mjs'
import eslintConfigTechor from 'eslint-config-techor'

export default [
    ...common,
    eslintConfigTechor.configs.typescript,
    eslintConfigTechor.configs.react,
    {
        ignores: [
            'dist/**',
            'playground/.next/**',
            'playground/next-env.d.ts'
        ]
    }
]
