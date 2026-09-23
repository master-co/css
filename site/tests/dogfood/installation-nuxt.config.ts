import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({
  ...foundations,
  globalSetup: './installation-nuxt-setup.ts',
  testMatch: ['installation.spec.ts', 'installation-nuxt.spec.ts'],
  grep: /Nuxt production application|complete installation guide \/nuxtjs/,
  outputDir: '../../test-results/installation-nuxt',
})
