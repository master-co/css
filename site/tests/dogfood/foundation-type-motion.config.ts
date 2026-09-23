import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['foundation-type-motion.spec.ts'], outputDir: '../../test-results/foundation-type-motion' })
