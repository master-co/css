import MagicString from 'magic-string'
import path from 'path'
import type { PluginContext } from '../core'
import { readFileSync } from 'fs'

export default function withInjectionTransform(
    id: string,
    context: PluginContext,
    mark: string,
    generate: () => string[]
): { code: string; map: any } | undefined {
    if (context.entryId !== id) return
    const code = readFileSync(id, 'utf-8')
    if (code.includes(mark)) return
    const ext = path.extname(id)
    const s = new MagicString(code)
    const injectCode = '\n' + mark + '\n' + generate().join('\n') + '\n'
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
                s.append(`\n<script>${injectCode}</script>\n`)
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
