import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['package-authoring.spec.ts'], outputDir: '../../test-results/package-authoring' })
