import type { ViteUserConfig } from 'vitest/config'
import { defaultVitestTestTimeout, withCIConcurrency } from '../../shared/vitest-ci-config'

const config: ViteUserConfig = {
    test: withCIConcurrency({
        include: [
            'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'tests/**/test.?(c|m)[jt]s?(x)'
        ],
        exclude: [
            '**/tmp/**'
        ],
        testTimeout: defaultVitestTestTimeout
    }),
    resolve: {
        tsconfigPaths: true
    }
}

export default config
