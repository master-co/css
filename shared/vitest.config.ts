import type { ViteUserConfig } from 'vitest/config'
import { compileCSSFile } from '../packages/compiler/src'
import { createCSSConfigLoader } from './css-config-loader'
import { createMasterCSSConfigLoaderPlugin } from './css-config-loader-plugin'
import { createConfig } from '../packages/core/src/utils/create-default-config'

const cssConfigLoader = createCSSConfigLoader({
    compileCSSFile,
    createConfigFromCSSDirectives: createConfig
})

const config: ViteUserConfig = {
    plugins: [
        createMasterCSSConfigLoaderPlugin({
            loadConfigModule: cssConfigLoader.loadCSSConfigModule
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
