import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  globalSetup: './installation-tanstack-setup.ts',
  testMatch: ['installation.spec.ts', 'installation-tanstack.spec.ts'],
  grep: /TanStack Start server|complete installation guide \/tanstack-start/,
  outputDir: '../../test-results/installation-tanstack',
})
