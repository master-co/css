import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['directives.spec.ts'], outputDir: '../../test-results/directives' })
