import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  globalSetup: './installation-router-setup.ts',
  testMatch: ['installation.spec.ts', 'installation-router.spec.ts'],
  grep: /React Router SSR adapter|complete installation guide \/react-router/,
  outputDir: '../../test-results/installation-router',
})
