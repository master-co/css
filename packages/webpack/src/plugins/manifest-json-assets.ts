import type { Compiler, Compilation } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

export default function ManifestJSONAssetsPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            compiler.hooks.thisCompilation.tap(context.name, (compilation: Compilation) => {
                if (!compilation.hooks.processAssets?.tap || !compilation.emitAsset) return
                const emitManifestJSONAssets = () => {
                    const RawSource = compiler.webpack.sources.RawSource
                    for (const [assetFileName, json] of context.getManifestJSONAssets()) {
                        compilation.emitAsset(assetFileName, new RawSource(json), {
                            immutable: true
                        })
                    }
                }

                compilation.hooks.processAssets.tap({
                    name: context.name,
                    stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
                }, emitManifestJSONAssets)
            })
        }
    }
}
