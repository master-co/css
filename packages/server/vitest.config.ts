import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig({
  ...config,
  test: {
    ...config.test,
    include: [
      'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)',
      'tests/**/test.?(c|m)[jt]s?(x)',
      'e2e/**/test.?(c|m)[jt]s?(x)'
    ]
  }
})
