import { defineConfig } from 'vitest/config'
import shared from '../../shared/vitest.config'

export default defineConfig({
  ...shared,
  test: { ...shared.test, include: ['e2e/**/*.test.ts'], maxWorkers: 1 }
})
