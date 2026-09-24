import { defineConfig } from '@playwright/test'
import demos from './demo.config'

export default defineConfig({ ...demos, testMatch: ['natural-colors.spec.ts'], outputDir: '../../test-results/natural-colors' })
