import { fixupConfigRules } from '@eslint/compat'
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import masterCSS from '@master/eslint-config-css'

export default defineConfig([
  ...fixupConfigRules(nextVitals),
  ...fixupConfigRules(nextTs),
  ...masterCSS,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts'
  ])
])
