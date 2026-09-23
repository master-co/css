import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['guide-tooling.spec.ts'], outputDir: '../../test-results/guide-tooling' })
