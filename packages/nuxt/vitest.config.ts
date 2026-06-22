import { defineConfig } from 'vitest/config'
import { defaultVitestTestTimeout, withCIConcurrency } from '../../shared/vitest-ci-config'

export default defineConfig({
    test: withCIConcurrency({
        environment: 'node',
        include: [
            'tests/**/*.test.ts'
        ],
        testTimeout: defaultVitestTestTimeout,
        fileParallelism: false
    })
})
