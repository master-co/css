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
                    },
                    async loadPlanModule(...args) {
                        const { compileCSSPlanModule } = await import('../compiler/src')
                        return compileCSSPlanModule(...args)
                    }
                })
            ]
        }
    }
}

export default config
