import { defineConfig } from '@playwright/test'
import demos from './demo.config'

export default defineConfig({ ...demos, testMatch: ['refinement.spec.ts'], outputDir: '../../test-results/refinement' })
