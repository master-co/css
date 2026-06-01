import type { ViteUserConfig } from 'vitest/config'
import { createMasterCSSConfigLoaderPlugin } from '../packages/explore-config/src'
import { loadCoreThemeConfigModule } from '../packages/core/theme-config-loader'

const config: ViteUserConfig = {
    plugins: [
        createMasterCSSConfigLoaderPlugin({
            loadConfigModule: loadCoreThemeConfigModule
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
