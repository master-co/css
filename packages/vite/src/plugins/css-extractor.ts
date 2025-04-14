import CSSExtractor from '@master/css-extractor'
import { Options } from './core'
import type { Plugin } from 'vite'
import { Options as ExtractorOptions } from '@master/css-extractor'
import VirtualCSSModulePlugins from './virtual-css-module'
import VirtualCSSHMRPlugin from './virtual-css-hmr'

export default function CSSExtractorPlugins(options: Options, cwd = process.cwd()): Plugin[] {
    const extractor = new CSSExtractor(options.extractor, cwd)
    extractor.on('init', (opt: ExtractorOptions) => {
        opt.include = []
    })
    return [
        {
            name: 'master-css-extractor',
            enforce: 'pre',
            apply(_, env) {
                if (!env.isSsrBuild) {
                    extractor.init()
                    return true
                } else {
                    return false
                }
            },
            async buildStart() {
                await extractor.prepare()
            },
            async transform(code, id) {
                const resolvedVirtualModuleId = extractor.resolvedVirtualModuleId
                if (id !== resolvedVirtualModuleId && !id.endsWith('.css')) {
                    await extractor.insert(id, code)
                }
            }
        },
        VirtualCSSHMRPlugin(extractor),
        ...VirtualCSSModulePlugins(extractor),
    ]
}