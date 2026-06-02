import type { Config } from 'techor'
import { compileCSSFile } from '../compiler/src'
import { createCSSConfigLoader } from 'shared/css-config-loader'
import { createMasterCSSConfigLoaderPlugin } from 'shared/css-config-loader-plugin'
import createConfigFromCSSDirectives from '../core/src/utils/create-config-from-css-directives'

const cssConfigLoader = createCSSConfigLoader({
    compileCSSFile,
    createConfigFromCSSDirectives
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
