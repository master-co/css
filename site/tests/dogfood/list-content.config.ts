import { defineConfig } from '@playwright/test'
import positioning from './positioning.config'

export default defineConfig({ ...positioning, testMatch: ['list-content.spec.ts'], outputDir: '../../test-results/list-content' })
