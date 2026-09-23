import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  globalSetup: './installation-next-setup.ts',
  testMatch: ['installation.spec.ts', 'installation-next.spec.ts'],
  grep: /Next.js production application|complete installation guide \/nextjs/,
  outputDir: '../../test-results/installation-next',
})
