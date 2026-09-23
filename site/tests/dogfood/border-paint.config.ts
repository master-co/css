import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['border-paint.spec.ts'], outputDir: '../../test-results/border-paint' })
