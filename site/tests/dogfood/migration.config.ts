import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['migration.spec.ts'], outputDir: '../../test-results/migration' })
