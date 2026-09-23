import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['migration-vendors.spec.ts'], outputDir: '../../test-results/migration-vendors' })
