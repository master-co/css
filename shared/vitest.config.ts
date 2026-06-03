import type { ViteUserConfig } from 'vitest/config'
import { compileCSSConfigModule } from '../packages/compiler/src'
import { createMasterCSSConfigLoaderPlugin } from './css-config-loader-plugin'

const config: ViteUserConfig = {
    plugins: [
        createMasterCSSConfigLoaderPlugin({
            loadConfigModule: compileCSSConfigModule
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
