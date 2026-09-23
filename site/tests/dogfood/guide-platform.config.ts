import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['guide-platform.spec.ts'], outputDir: '../../test-results/guide-platform' })
