import type { Config } from 'techor'
import { createMasterCSSPlanLoaderPlugin } from '../integration/src/plan-loader-plugin'

const config: Config = {
    build: {
        input: {
            plugins: [
                createMasterCSSPlanLoaderPlugin({
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
