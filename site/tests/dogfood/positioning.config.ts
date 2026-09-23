import { defineConfig, devices } from '@playwright/test'
import demos from './demo.config'

export default defineConfig({
  ...demos,
  testMatch: ['positioning.spec.ts'],
  outputDir: '../../test-results/positioning',
  projects: [
    ...demos.projects!,
    { name: 'tablet-light', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 900 }, colorScheme: 'light' } },
    { name: 'tablet-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 900 }, colorScheme: 'dark' } },
  ],
})
