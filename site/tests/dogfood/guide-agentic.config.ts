import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['guide-agentic.spec.ts'], outputDir: '../../test-results/guide-agentic' })
