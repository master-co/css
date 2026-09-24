import { defineConfig } from '@playwright/test'
import demos from './demo.config'

export default defineConfig({ ...demos, testMatch: ['code-block.spec.ts'], outputDir: '../../test-results/code-block' })
