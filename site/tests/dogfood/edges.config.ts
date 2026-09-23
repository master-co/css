import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['edges.spec.ts'], outputDir: '../../test-results/edges' })
