import type { Config } from 'techor'
import { createMasterCSSConfigLoaderPlugin } from '../explore-config/src'
import { loadCoreThemeConfigModule } from './theme-config-loader'

const config: Config = {
    build: {
        input: {
            plugins: [
                createMasterCSSConfigLoaderPlugin({
                    loadConfigModule: loadCoreThemeConfigModule
                })
            ]
        }
    }
}

export default config
