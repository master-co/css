import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['token-reference.spec.ts'], outputDir: '../../test-results/token-reference' })
