import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, workers: 1, timeout: 480_000, testMatch: ['design-system.spec.ts'], outputDir: '../../test-results/design-system' })
