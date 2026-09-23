import { defineConfig } from '@playwright/test'
import foundations from './foundations.config'

// The full gallery synchronously renders many MDX specimens in the dev server.
// Serialize this matrix so concurrent gallery builds do not starve Wasm requests.
export default defineConfig({ ...foundations, workers: 1, testMatch: ['final-pages.spec.ts'], outputDir: '../../test-results/final-pages' })
