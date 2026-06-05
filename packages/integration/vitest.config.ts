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
        testTimeout: 15000
    },
    resolve: {
        tsconfigPaths: true
    }
}

export default config
