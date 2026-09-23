import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  testMatch: ['installation.spec.ts', 'installation-bundlers.spec.ts'],
  grep: /authored bundler build|complete installation guide \/(webpack|rspack|rsbuild)/,
  outputDir: '../../test-results/installation-bundlers',
})
