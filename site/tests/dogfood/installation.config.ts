import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

export default defineConfig({ ...foundations, testMatch: ['installation.spec.ts', 'installation-frameworks.spec.ts'], outputDir: '../../test-results/installation' })
