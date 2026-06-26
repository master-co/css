import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'
import { defaultVitestTestTimeout, withCITimeouts } from '../../shared/vitest-ci-config'

export default defineConfig({
    ...config,
    test: withCITimeouts({
        ...config.test,
        testTimeout: defaultVitestTestTimeout
    })
})
