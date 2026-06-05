import type { Plugin } from 'vite'
import { toPreloadedModule } from '@master/css-integration/preloaded-module'
import type { PluginContext } from '../core'
import { RESOLVED_VIRTUAL_PRELOADED_ID, VIRTUAL_PRELOADED_ID } from '../common'
import { getExtractedCSSResult } from '../utils/extracted-css'

export default function PreloadedVirtualModulePlugin(
    context: PluginContext
): Plugin {
    return {
        name: 'master-css:virtual-module:preloaded',
        enforce: 'pre',
        async resolveId(id) {
            if (id === VIRTUAL_PRELOADED_ID) return RESOLVED_VIRTUAL_PRELOADED_ID
        },
        async load(id) {
            if (id !== RESOLVED_VIRTUAL_PRELOADED_ID) return
            const result = await getExtractedCSSResult(context)
            return toPreloadedModule(result.preloaded)
        }
    }
}
