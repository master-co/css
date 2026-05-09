import type { Plugin } from 'vite'
import withInjectionTransform from '../factories/with-injection-transform'
import type { PluginContext } from '../core'
import { PluginOptions } from '../options'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { isMasterStyleSource } from '../utils/style-css'

const __MASTER_CSS_VIRTUAL_MODULE_INJECTED__ = '/*__MASTER_CSS_VIRTUAL_MODULE_INJECTED__*/'
const JS_CSS_IMPORT_RE = /import\s+(?:[^'"]*?\s+from\s*)?["']([^"']+\.(?:css|scss|sass)(?:\?[^"']*)?)["']|import\(\s*["']([^"']+\.(?:css|scss|sass)(?:\?[^"']*)?)["']\s*\)/g

function cleanUrl(id: string): string {
    return id.replace(/[?#].*$/, '')
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractCSSImportSpecifiers(code: string): string[] {
    const specifiers: string[] = []
    for (const match of code.matchAll(JS_CSS_IMPORT_RE)) {
        const specifier = match[1] || match[2]
        if (specifier) {
            specifiers.push(specifier)
        }
    }
    return specifiers
}

async function importsVirtualCSSFromCSS(
    code: string,
    id: string,
    context: PluginContext,
    resolve: (source: string, importer?: string) => Promise<{ id: string } | null | undefined>
): Promise<boolean> {
    const moduleId = context.extractor?.options.module
    if (!moduleId) return false

    for (const specifier of extractCSSImportSpecifiers(code)) {
        const resolved = await resolve(specifier, id)
        const cssPath = cleanUrl(resolved?.id || path.resolve(path.dirname(cleanUrl(id)), specifier))
        if (cssPath.startsWith('\0') || !existsSync(cssPath)) continue
        if (isMasterStyleSource(readFileSync(cssPath, 'utf-8'), moduleId)) {
            return true
        }
    }
    return false
}

export function removeSideEffectImport(code: string, specifier: string): { code: string, removed: boolean } {
    let removed = false
    const importRE = new RegExp(`(^|\\n)\\s*import\\s*["']${escapeRegExp(specifier)}["'];?\\s*`, 'g')
    const nextCode = code.replace(importRE, (match, prefix: string) => {
        removed = true
        return prefix
    })
    return { code: nextCode, removed }
}

export default function InjectVirtualModulePlugin(
    options: PluginOptions,
    context: PluginContext,
): Plugin {
    return {
        name: 'master-css:inject-virtual-module',
        enforce: 'pre',
        async transform(code, id) {
            if (context.entryId === id && await importsVirtualCSSFromCSS(code, id, context, this.resolve.bind(this))) {
                const result = removeSideEffectImport(code, context.extractor.options.module as string)
                if (result.removed) {
                    return {
                        code: result.code,
                        map: null
                    }
                }
                return null
            }
            return withInjectionTransform(code, id, context, __MASTER_CSS_VIRTUAL_MODULE_INJECTED__, () => `import '${context.extractor?.options.module}'`)
        }
    }
}
