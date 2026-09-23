import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['project-styles.spec.ts'], outputDir: '../../test-results/project-styles' })
