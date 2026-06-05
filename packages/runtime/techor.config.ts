import type { Config } from 'techor'
import { createMasterCSSConfigLoaderPlugin } from '../integration/src/config-loader-plugin'

const config: Config = {
    build: {
        input: {
            plugins: [
                createMasterCSSConfigLoaderPlugin({
                    async loadConfigModule(...args) {
                        const { compileCSSConfigModule } = await import('../compiler/src')
                        return compileCSSConfigModule(...args)
                    }
                })
            ]
        }
    }
}

export default config
