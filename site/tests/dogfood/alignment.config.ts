import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['alignment.spec.ts'], outputDir: '../../test-results/alignment' })
