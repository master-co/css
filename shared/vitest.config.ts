import type { ViteUserConfig } from 'vitest/config'
import { createMasterCSSPlanLoaderPlugin } from '../packages/integration/src/plan-loader-plugin'

const config: ViteUserConfig = {
    plugins: [
        createMasterCSSPlanLoaderPlugin({
            async loadPlanJSON(...args) {
                const { compileCSSPlanJSON } = await import('../packages/compiler/src')
                return compileCSSPlanJSON(...args)
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
    },
    resolve: {
        tsconfigPaths: true
    }
}

export default config
