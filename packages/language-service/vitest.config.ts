import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig({
    ...config,
    test: {
        ...config.test,
        testTimeout: 60_000,
        maxConcurrency: 1
    }
})
