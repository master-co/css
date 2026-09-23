import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['scrolling.spec.ts'], outputDir: '../../test-results/scrolling' })
