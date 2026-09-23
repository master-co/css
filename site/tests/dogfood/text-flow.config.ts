import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['text-flow.spec.ts'], outputDir: '../../test-results/text-flow' })
