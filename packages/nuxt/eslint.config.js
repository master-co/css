import common from '../../eslint.config.js'

export default [
  ...common,
  {
    ignores: [
      '**/.nuxt/**',
      'dist/**',
      'playground/.output/**'
    ]
  }
]
