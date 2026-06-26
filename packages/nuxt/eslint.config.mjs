import common from '../../eslint.config.mjs'

export default [
    ...common,
    {
        ignores: [
            '.nuxt/**',
            'dist/**',
            'playground/.nuxt/**',
            'playground/.output/**'
        ]
    }
]
