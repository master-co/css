import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['effects.spec.ts'], outputDir: '../../test-results/effects' })
