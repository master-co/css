import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['delivery.spec.ts'], outputDir: '../../test-results/delivery' })
