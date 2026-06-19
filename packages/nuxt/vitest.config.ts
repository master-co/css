import { defineConfig } from 'vitest/config'
import { withCIConcurrency } from '../../shared/vitest-ci-config'

export default defineConfig({
    test: withCIConcurrency({
        environment: 'node',
        include: [
            'tests/**/*.test.ts'
        ],
        testTimeout: 60_000,
        fileParallelism: false
    })
})
