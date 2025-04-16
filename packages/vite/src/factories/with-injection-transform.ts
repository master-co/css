import MagicString from 'magic-string'
import path from 'path'
import type { PluginContext } from '../core'

export default function withInjectionTransform(
    code: string,
    id: string,
    context: PluginContext,
    mark: string,
    generate: () => string[]
): { code: string; map: any } | undefined {
    if (context.entryId !== id || code.includes(mark)) return
    const ext = path.extname(id)
    const s = new MagicString(code)
    const injectCode = mark + '\n' + generate().join('\n') + '\n'
    switch (ext) {
        case '.vue': {
            const hasScriptSetup = /<script\s+setup.*?>/.test(code)
            if (hasScriptSetup) {
                s.replace(/(<script\s+setup.*?>)/, `$1\n${injectCode}`)
            } else {
                s.prepend(`<script setup>\n${injectCode}</script>\n`)
            }
            break
        }
        default:
            s.prepend(injectCode)
    }
    if (process.env.DEBUG) {
        console.log(`[@master/css.vite] ${mark} -> ${id}`)
    }
    return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
    }
}
