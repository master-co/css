import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['shapes.spec.ts'], outputDir: '../../test-results/shapes' })
