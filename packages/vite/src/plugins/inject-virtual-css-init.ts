import type { Plugin } from 'vite'
import MagicString from 'magic-string'
import { PluginContext, PluginOptions } from '../core'
import CSSBuilder from '@master/css-builder'

const __MASTER_CSS_VIRTUAL_CSS_IMPORT_INJECTED__ = '/*__MASTER_CSS_VIRTUAL_CSS_IMPORT_INJECTED__*/'

export default function InjectVirtualCSSImportPlugin(options: PluginOptions, context: PluginContext, builder: CSSBuilder): Plugin {
    return {
        name: 'master-css:inject-virtual-css-import',
        enforce: 'pre',
        transform(code, id) {
            if (context.entryId !== id || code.includes(__MASTER_CSS_VIRTUAL_CSS_IMPORT_INJECTED__)) return
            const s = new MagicString(code)
            const imports = [
                __MASTER_CSS_VIRTUAL_CSS_IMPORT_INJECTED__,
                `import '${builder.options.module}'`,
            ]
            s.prepend(imports.join('\n') + '\n')
            return {
                code: s.toString(),
                map: s.generateMap({ hires: true }),
            }
        }
    }
}
