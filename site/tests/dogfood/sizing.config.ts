import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['sizing.spec.ts'], outputDir: '../../test-results/sizing' })
