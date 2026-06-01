import type { Config } from 'techor'
import { compileCSSFile } from '../compiler/src'
import { createCSSConfigLoader } from 'shared/css-config-loader'
import { createMasterCSSConfigLoaderPlugin } from 'shared/css-config-loader-plugin'
import { createConfig } from './src/utils/create-default-config'

const cssConfigLoader = createCSSConfigLoader({
    compileCSSFile,
    createConfigFromCSSDirectives: createConfig
})

const config: Config = {
    build: {
        input: {
            plugins: [
                createMasterCSSConfigLoaderPlugin({
                    loadConfigModule: cssConfigLoader.loadCSSConfigModule
                })
            ]
        }
    }
}

export default config
