import { defineConfig } from '@playwright/test'
import demos from './demo.config'

export default defineConfig({
  ...demos,
  testMatch: ['utility-audit.spec.ts'],
  outputDir: '../../test-results/utility-audit',
  workers: 2
})
