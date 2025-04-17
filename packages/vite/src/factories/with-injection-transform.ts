import MagicString from 'magic-string'
import path from 'path'
import type { PluginContext } from '../core'

export default function withInjectionTransform(
    code: string,
    id: string,
    context: PluginContext,
    mark: string,
    generate: () => string
): { code: string; map: any } | null {
    if (context.entryId !== id || code.includes(mark)) return null
    const ext = path.extname(id)
    const s = new MagicString(code)
    const injectCode = '\n' + mark + '\n' + generate() + '\n'
    switch (ext) {
        case '.vue': {
            const hasScriptSetup = /<script\s+setup.*?>/.test(code)
            const hasScript = /<script.*?>/.test(code)
            if (hasScriptSetup) {
                s.replace(/(<script\s+setup.*?>)/, `$1${injectCode}`)
            } else if (hasScript) {
                s.replace(/(<script.*?>)/, `$1${injectCode}`)
            } else {
                s.append(`\n<script setup>${injectCode}</script>`)
            }
            break
        }
        case '.svelte':
            const hasScriptSetup = /<script.*?>/.test(code)
            if (hasScriptSetup) {
                s.replace(/(<script.*?>)/, `$1${injectCode}`)
            } else {
                s.append(injectCode)
            }
            break
        case '.astro':
            const hasScriptSetupAstro = /<script.*?>/.test(code)
            if (hasScriptSetupAstro) {
                s.replace(/(<script.*?>)/, `$1${injectCode}`)
            } else {
                s.append(injectCode)
            }
            break
        default:
            s.append(injectCode)
    }
    if (process.env.DEBUG) {
        console.log(`[@master/css.vite] ${mark} -> ${id}`)
    }
    return {
        code: s.toString(),
        map: s.generateMap({ hires: true }),
    }
}
