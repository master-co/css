import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['media.spec.ts'], outputDir: '../../test-results/media' })
