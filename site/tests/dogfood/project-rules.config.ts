import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['project-rules.spec.ts'], outputDir: '../../test-results/project-rules' })
