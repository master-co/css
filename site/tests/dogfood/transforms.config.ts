import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['transforms.spec.ts'], outputDir: '../../test-results/transforms' })
