import { Options } from './core'
import type { Plugin } from 'vite'
import CSSBuilder, { Options as ExtractorOptions } from '@master/css-builder'
import VirtualCSSModulePlugins from './virtual-css-module'
import VirtualCSSHMRPlugin from './virtual-css-hmr'

export default function CSSExtractorPlugins(options: Options, cwd = process.cwd()): Plugin[] {
    const builder = new CSSBuilder(options.builder, cwd)
    builder.on('init', (opt: ExtractorOptions) => {
        opt.include = []
    })
    return [
        {
            name: 'master-css-builder',
            enforce: 'pre',
            apply(_, env) {
                if (!env.isSsrBuild) {
                    builder.init()
                    return true
                } else {
                    return false
                }
            },
            async buildStart() {
                await builder.prepare()
            },
            async transform(code, id) {
                const resolvedVirtualModuleId = builder.resolvedVirtualModuleId
                if (id !== resolvedVirtualModuleId && !id.endsWith('.css')) {
                    await builder.insert(id, code)
                }
            }
        },
        VirtualCSSHMRPlugin(builder),
        ...VirtualCSSModulePlugins(builder),
    ]
}