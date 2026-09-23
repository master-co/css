import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['backgrounds.spec.ts'], outputDir: '../../test-results/backgrounds' })
