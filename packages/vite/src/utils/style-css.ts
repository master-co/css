import type { CompileCSSOptions, CompileCSSResult } from '@master/css-compiler'
import { compileCSS } from '@master/css-compiler'
import { createRequire } from 'node:module'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { PluginContext } from '../core'

export const STYLE_CSS_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/
const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g
const require = createRequire(import.meta.url)

export function cleanStyleRequest(id: string): string {
    return id.replace(/[?#].*$/, '')
}

export function isStyleCSSRequest(id: string): boolean {
    return STYLE_CSS_REQUEST_RE.test(id)
}

export function replaceVirtualCSSImport(code: string, moduleId: string, replacement: string): { code: string, replaced: boolean } {
    let replaced = false
    const nextCode = code.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
        if (id !== moduleId) return rule
        replaced = true
        return replacement
    })
    return { code: nextCode, replaced }
}

export function removeVirtualCSSImport(code: string, moduleId: string): { code: string, replaced: boolean } {
    return replaceVirtualCSSImport(code, moduleId, '')
}

export function hasVirtualCSSImport(code: string, moduleId: string): boolean {
    return removeVirtualCSSImport(code, moduleId).replaced
}

export function isMasterStyleSource(source: string, moduleId: string): boolean {
    return source.includes('@master') || hasVirtualCSSImport(source, moduleId)
}

async function preprocessStyleCSS(source: string, id: string): Promise<string> {
    const filename = cleanStyleRequest(id)
    const extension = extname(filename)
    if (extension !== '.scss' && extension !== '.sass') {
        return source
    }

    const sass = require('sass')
    const result = await sass.compileStringAsync(source, {
        url: pathToFileURL(filename),
        style: 'expanded',
        syntax: extension === '.sass' ? 'indented' : 'scss'
    })
    return result.css
}

export async function compileStyleCSS(
    id: string,
    source: string,
    options: CompileCSSOptions = {}
): Promise<CompileCSSResult> {
    const css = await preprocessStyleCSS(source, id)
    return compileCSS(css, {
        ...options,
        from: cleanStyleRequest(id)
    })
}

function refreshExtractorNativeClasses(context: PluginContext, nativeClassNames: string[]) {
    let changed = false
    for (const className of nativeClassNames) {
        if (!context.extractor.nativeClassNames.has(className)) {
            context.extractor.nativeClassNames.add(className)
            changed = true
        }
        if (context.extractor.latentClasses.has(className) && !context.extractor.usedNativeClasses.has(className)) {
            context.extractor.usedNativeClasses.add(className)
            changed = true
        }
    }
    if (changed) {
        context.extractor.emit('change')
    }
}

export async function registerStyleCSSSource(context: PluginContext, id: string, source: string): Promise<void> {
    const filename = cleanStyleRequest(id)
    const cleanSource = removeVirtualCSSImport(source, context.extractor.options.module as string).code
    const result = await compileStyleCSS(filename, cleanSource)
    context.styleCSSSources ??= new Map()
    context.styleCSSSources.set(filename, cleanSource)
    refreshExtractorNativeClasses(context, result.nativeClassNames)
}
