import type { ViteUserConfig } from 'vitest/config'
import { defaultVitestTestTimeout, withCIConcurrency } from './vitest-ci-config'

const config: ViteUserConfig = {
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
}

export default config
