import { defineConfig } from 'vitest/config'
import { defaultVitestTestTimeout, withCIConcurrency } from '../../shared/vitest-ci-config'

export default defineConfig({
    test: withCIConcurrency({
        include: [
            'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'tests/**/test.?(c|m)[jt]s?(x)'
        ],
        exclude: [
            '**/tmp/**'
        ],
        testTimeout: defaultVitestTestTimeout,
        forceRerunTriggers: [
            'vitest.config.*',
            'vite.config.*',
            '**/*generated.css',
            'package.json',
            '**/*.output.*',
            '**/*.input.*',
            '**/fixtures/**/*'
        ]
    }),
    resolve: {
        tsconfigPaths: true
    }
})
