import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  testMatch: ['installation.spec.ts', 'installation-servers.spec.ts'],
  grep: /authored server assets|complete installation guide \/(express|php|rails)/,
  outputDir: '../../test-results/installation-servers',
})
