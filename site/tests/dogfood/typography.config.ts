import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['typography.spec.ts'], outputDir: '../../test-results/typography' })
