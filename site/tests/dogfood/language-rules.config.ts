import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['language-rules.spec.ts'], outputDir: '../../test-results/language-rules' })
