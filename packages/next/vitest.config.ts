import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

const runsE2E = process.env.npm_lifecycle_event === 'e2e'

export default defineConfig({
  ...config,
  test: runsE2E
    ? config.test
    : {
      ...config.test,
      exclude: [
        ...(config.test?.exclude ?? []),
        'tests/*-e2e.test.ts'
      ]
    }
})
