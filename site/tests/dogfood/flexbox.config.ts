import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['flexbox.spec.ts'], outputDir: '../../test-results/flexbox' })
