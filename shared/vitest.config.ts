import type { ViteUserConfig } from 'vitest/config'
import { createMasterCSSPlanLoaderPlugin } from '../packages/integration/src/config-loader-plugin'

const config: ViteUserConfig = {
    plugins: [
        createMasterCSSPlanLoaderPlugin({
            async loadPlanModule(...args) {
                const { compileCSSPlanModule } = await import('../packages/compiler/src')
                return compileCSSPlanModule(...args)
            }
        })
    ],
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
            '**/*.input.*',
            '**/fixtures/**/*'
        ]
    },
    resolve: {
        tsconfigPaths: true
    }
}

export default config
