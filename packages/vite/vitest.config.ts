import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

// These suites open many real file watchers. Batched Windows/macOS notifications
// must not spill across concurrent lifecycle tests and their negative assertions.
const serialWatchers = process.platform === 'win32' || process.platform === 'darwin'

export default defineConfig({
  ...config,
  test: {
    ...config.test,
    ...(serialWatchers ? { fileParallelism: false } : {})
  }
})
