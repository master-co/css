import { defineConfig } from 'vitest/config'
import config from '../../shared/vitest.config'
import { defaultVitestTestTimeout, withCIConcurrency } from '../../shared/vitest-ci-config'

export default defineConfig({
    ...config,
    test: withCIConcurrency({
        ...config.test,
        testTimeout: defaultVitestTestTimeout
    })
})
