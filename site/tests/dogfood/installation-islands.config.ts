import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  testMatch: ['installation.spec.ts', 'installation-islands.spec.ts'],
  grep: /authored islands build|complete installation guide \/(astro|svelte)/,
  outputDir: '../../test-results/installation-islands',
})
