import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['package-apis.spec.ts'], outputDir: '../../test-results/package-apis' })
