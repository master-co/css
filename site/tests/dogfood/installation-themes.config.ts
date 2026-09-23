import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  testMatch: ['installation.spec.ts', 'installation-themes.spec.ts'],
  grep: /authored theme assets|complete installation guide \/(laravel|wordpress|shopify)/,
  outputDir: '../../test-results/installation-themes',
})
