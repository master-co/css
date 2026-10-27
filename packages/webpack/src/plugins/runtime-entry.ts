import { fileURLToPath } from 'node:url'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

/** Progressive pages may never start the engine, so their entry loads the program lazily. */
function resolveRuntimePath(mode: MasterCSSWebpackContext['mode']) {
  return fileURLToPath(new URL(mode === 'progressive' ? '../progressive-runtime.js' : '../runtime.js', import.meta.url))
}

export default function RuntimeEntryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      const EntryPlugin = compiler.webpack?.EntryPlugin
      if (!EntryPlugin) return
      const publicPath = compiler.options?.output?.publicPath
      // This entry can be injected into HTML at different depths. Resolve its
      // dependent JSON/Wasm/chunks from the emitted script's output root.
      const relativePublicPath = typeof publicPath === 'string'
        && publicPath !== 'auto' && !/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(publicPath)
      const filename = compiler.options?.output?.filename
      // A fixed (or opaque callback) application filename cannot safely name
      // this additional entry. Keep chunk-specific templates when provided.
      const needsRuntimeFilename = typeof filename === 'function'
        || (typeof filename === 'string' && !/\[(?:name|id|chunkhash|contenthash)(?::\d+)?\]/.test(filename))
      new EntryPlugin(compiler.context || context.compilerContext, resolveRuntimePath(context.mode), {
        name: context.runtimeEntryName,
        ...(needsRuntimeFilename ? {
          filename: `_master-css/${context.runtimeEntryName}.[contenthash:8].${compiler.options.output.module ? 'mjs' : 'js'}`
        } : {}),
        ...(relativePublicPath ? { publicPath: 'auto' } : {})
      }).apply(compiler)
    }
  }
}
