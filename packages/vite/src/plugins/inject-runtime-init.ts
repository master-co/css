import type { Plugin } from 'vite'
import MagicString from 'magic-string'
import path from 'path'
import { PluginContext, PluginOptions } from '../core'

const __MASTER_CSS_RUNTIME_INIT_INJECTED__ = '/*__MASTER_CSS_RUNTIME_INIT_INJECTED__*/'

export default function InjectCSSRuntimeInitPlugin(options: PluginOptions, context: PluginContext): Plugin {
    return {
        name: 'master-css:inject-runtime-init',
        enforce: 'pre',
        transform(code, id) {
            if (context.entryId !== id || code.includes(__MASTER_CSS_RUNTIME_INIT_INJECTED__)) return
            const s = new MagicString(code)
            const imports = [
                __MASTER_CSS_RUNTIME_INIT_INJECTED__,
                `import { initCSSRuntime } from '@master/css-runtime'`,
            ]
            if (context.configId) {
                const relativeConfigId = path.relative(path.dirname(id), context.configId)
                imports.push(`import config from '${relativeConfigId.startsWith('./') ? relativeConfigId : `./${relativeConfigId}`}'`)
                imports.push(`initCSSRuntime(config)`)
            } else {
                imports.push(`initCSSRuntime()`)
            }
            s.prepend(imports.join('\n') + '\n')
            return {
                code: s.toString(),
                map: s.generateMap({ hires: true }),
            }
        }
    }
}
