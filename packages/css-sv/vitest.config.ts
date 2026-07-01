import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

const setupHookTimeout = process.env.CI ? 180000 : 60000

export default defineConfig({
    ...config,
    test: {
        ...config.test,
        globalSetup: './tests/global-setup.ts',
        hookTimeout: setupHookTimeout
    }
})
