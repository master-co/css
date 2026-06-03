import { fileURLToPath } from 'node:url'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

function resolveStyleCSSLoaderPath() {
    return fileURLToPath(new URL('../style-css-loader.mjs', import.meta.url))
}

export default function StyleEntryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.options.module.rules.push({
                test: /\.(css|scss|sass)$/,
                enforce: 'pre',
                use: [
                    {
                        loader: resolveStyleCSSLoaderPath(),
                        options: {
                            virtualCSSImportModuleId: context.virtualCSSImportModuleId
                        }
                    }
                ]
            })
        }
    }
}
