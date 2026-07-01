import { fileURLToPath } from 'node:url'
import type { Compiler } from 'webpack'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

function resolveRuntimePath() {
    return fileURLToPath(new URL('../runtime.js', import.meta.url))
}

export default function RuntimeEntryPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
    return {
        apply(compiler: Compiler) {
            const EntryPlugin = compiler.webpack?.EntryPlugin
            if (!EntryPlugin) return
            new EntryPlugin(compiler.context || context.compilerContext, resolveRuntimePath(), {
                name: context.runtimeEntryName
            }).apply(compiler)
        }
    }
}
