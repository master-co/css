import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

const runsOnWindows = process.platform === 'win32'

export default defineConfig({
  ...config,
  test: {
    ...config.test,
    ...(runsOnWindows ? { fileParallelism: false } : {})
  }
})
