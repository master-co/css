import common, { reactConfig } from '../../eslint.config.js'

export default [
  ...common,
  reactConfig,
  {
    ignores: [
      'dist/**',
      'e2e/**/next-env.d.ts',
      'playground/.next/**',
      'playground/next-env.d.ts'
    ]
  }
]
