import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['foundation-paint.spec.ts'], outputDir: '../../test-results/foundation-paint' })
