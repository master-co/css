import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['animations.spec.ts'], outputDir: '../../test-results/animations' })
