import type { Compiler, Compilation } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'
import { collectProgramAssetReferences } from '../utils/program-module'

/** Emits the runtime programs that the compiled production program modules fetch. */
export default function ProgramAssetsPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.thisCompilation.tap(context.name, (compilation: Compilation) => {
        if (!compilation.hooks.processAssets?.tap || !compilation.emitAsset || !compiler.webpack?.Compilation || !compiler.webpack?.sources?.RawSource) return
        compilation.hooks.processAssets.tap({
          name: context.name,
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        }, () => {
          const RawSource = compiler.webpack.sources.RawSource
          for (const assetFileName of collectProgramAssetReferences(compilation.modules).fileNames) {
            const program = context.getProgramAsset(assetFileName)
            if (!program) {
              compilation.errors.push(new Error(`Master CSS cannot emit the runtime program ${assetFileName}: its module was not compiled by this plugin instance.`))
              continue
            }
            compilation.emitAsset(assetFileName, new RawSource(Buffer.from(program.buffer, program.byteOffset, program.byteLength)), {
              immutable: true
            })
          }
        })
      })
    }
  }
}
