import type { Config } from 'techor'
import { createMasterCSSManifestLoaderPlugin } from '../integration/src/manifest-loader-plugin'

const config: Config = {
    build: {
        input: {
            plugins: [
                createMasterCSSManifestLoaderPlugin({
                    async loadManifestJSON(...args) {
                        const { compileCSSManifestJSON } = await import('../compiler/src')
                        return compileCSSManifestJSON(...args)
                    }
                })
            ]
        }
    }
}

export default config
