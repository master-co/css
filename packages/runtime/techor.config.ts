import type { Config } from 'techor'
import { createMasterCSSPlanLoaderPlugin } from '../integration/src/plan-loader-plugin'

const config: Config = {
    build: {
        input: {
            plugins: [
                createMasterCSSPlanLoaderPlugin({
                    async loadPlanJSON(...args) {
                        const { compileCSSPlanJSON } = await import('../compiler/src')
                        return compileCSSPlanJSON(...args)
                    }
                })
            ]
        }
    }
}

export default config
