import { defineConfig } from 'vitest/config'
import { defaultVitestTestTimeout, withCITimeouts } from '../../shared/vitest-ci-config'

export default defineConfig({
    test: withCITimeouts({
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
