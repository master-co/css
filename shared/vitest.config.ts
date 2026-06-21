import type { ViteUserConfig } from 'vitest/config'
import { createMasterCSSManifestLoaderPlugin } from '../packages/integration/src/manifest-loader-plugin'
import { withCIConcurrency } from './vitest-ci-config'

const config: ViteUserConfig = {
    plugins: [
        createMasterCSSManifestLoaderPlugin({
            async loadManifestJSON(...args) {
                const { compileCSSManifestJSON } = await import('../packages/compiler/src')
                return compileCSSManifestJSON(...args)
            }
        })
    ],
    test: withCIConcurrency({
        include: [
            'tests/**/*.{test,spec}.?(c|m)[jt]s?(x)',
            'tests/**/test.?(c|m)[jt]s?(x)'
        ],
        exclude: [
            '**/tmp/**'
        ],
        testTimeout: 60_000,
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
