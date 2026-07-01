import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'

export default defineConfig({
    ...config,
    test: {
        ...config.test,
        globalSetup: './tests/global-setup.ts',
        hookTimeout: 60000
    }
})
