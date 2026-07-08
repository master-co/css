import { defineConfig } from 'vitest/config'
import { defaultVitestTestTimeout, withCITimeouts } from '../../shared/vitest-ci-config'

export default defineConfig({
  test: withCITimeouts({
    environment: 'node',
    include: [
      'tests/**/*.test.ts'
    ],
    testTimeout: defaultVitestTestTimeout
  })
})
