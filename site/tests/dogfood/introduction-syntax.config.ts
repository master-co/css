import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, workers: 1, testMatch: ['introduction-syntax.spec.ts'], outputDir: '../../test-results/introduction-syntax' })
