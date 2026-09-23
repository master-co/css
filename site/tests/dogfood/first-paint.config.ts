import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['first-paint.spec.ts'], outputDir: '../../test-results/first-paint' })
