import tsconfigPaths from 'vite-tsconfig-paths'
import type { ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = {
    test: {
        include: [
            'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'tests/**/test.?(c|m)[jt]s?(x)'
        ],
        exclude: [
            '**/tmp/**'
        ],
        testTimeout: 15000,
        forceRerunTriggers: [
            'vitest.config.*',
            'vite.config.*',
            '**/*generated.css',
            'package.json',
            '**/*.output.*',
            '**/*.input.*'
        ]
    },
    plugins: [
        tsconfigPaths({
            ignoreConfigErrors: true
        })
    ]
}

export default config