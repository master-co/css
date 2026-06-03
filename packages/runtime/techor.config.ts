import type { Config } from 'techor'
import { compileCSSConfigModule } from '../compiler/src'
import { createMasterCSSConfigLoaderPlugin } from 'shared/css-config-loader-plugin'

const config: Config = {
    build: {
        input: {
            plugins: [
                createMasterCSSConfigLoaderPlugin({
                    loadConfigModule: compileCSSConfigModule
                })
            ]
        }
    }
}

export default config
