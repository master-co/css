import type { ViteUserConfig } from 'vitest/config'
import { createMasterCSSConfigLoaderPlugin } from '../packages/integration/src/config-loader-plugin'

const config: ViteUserConfig = {
    plugins: [
        createMasterCSSConfigLoaderPlugin({
            async loadConfigModule(...args) {
                const { compileCSSConfigModule } = await import('../packages/compiler/src')
                return compileCSSConfigModule(...args)
            },
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
