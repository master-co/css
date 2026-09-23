import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['foundations.spec.ts'], outputDir: '../../test-results/foundations' })
