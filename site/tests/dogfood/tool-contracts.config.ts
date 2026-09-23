import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['tool-contracts.spec.ts'], outputDir: '../../test-results/tool-contracts' })
