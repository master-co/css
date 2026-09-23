import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, workers: 1, timeout: 180_000, testMatch: ['production-load.spec.ts'], outputDir: '../../test-results/production-load' })
