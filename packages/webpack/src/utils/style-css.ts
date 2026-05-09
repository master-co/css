import type CSSExtractor from '@master/css-extractor'
import { compileCSS, type CompileCSSOptions, type CompileCSSResult } from '@master/css-compiler'
import { createRequire } from 'node:module'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'

export const STYLE_CSS_REQUEST_RE = /\.(css|scss|sass)(?:[?#].*)?$/
const CSS_IMPORT_RE = /@import\s+(?:url\(\s*)?(["'])([^"']+)\1\s*\)?[^;]*;/g
const require = createRequire(import.meta.url)

interface SassModule {
    compileStringAsync(source: string, options: {
        url: URL
        style: 'expanded'
        syntax: 'scss' | 'indented'
    }): Promise<{ css: string }>
}

export function cleanStyleRequest(id: string): string {
    return id.replace(/[?#].*$/, '')
}

export function isStyleCSSRequest(id: string): boolean {
    return STYLE_CSS_REQUEST_RE.test(id)
}

function getCSSImportIds(moduleIds: Iterable<string>) {
    const ids = new Set(moduleIds)
    for (const id of Array.from(ids)) {
        if (id.startsWith('virtual:')) {
            ids.add(id.slice('virtual:'.length))
        }
    }
    return ids
}

export function replaceVirtualCSSImports(source: string, moduleIds: Iterable<string>, replacement: string): { code: string, replaced: boolean } {
    let replaced = false
    const ids = getCSSImportIds(moduleIds)
    const code = source.replace(CSS_IMPORT_RE, (rule, _quote: string, id: string) => {
        if (!ids.has(id)) return rule
        replaced = true
        return replacement
    })
    return { code, replaced }
}

export function removeVirtualCSSImports(source: string, moduleIds: Iterable<string>): { code: string, replaced: boolean } {
    return replaceVirtualCSSImports(source, moduleIds, '')
}

export function isMasterStyleSource(source: string, moduleIds: Iterable<string>): boolean {
    return source.includes('@master') || removeVirtualCSSImports(source, moduleIds).replaced
}

async function preprocessStyleCSS(source: string, id: string): Promise<string> {
    const filename = cleanStyleRequest(id)
    const extension = extname(filename)
    if (extension !== '.scss' && extension !== '.sass') {
        return source
    }

    const sass = require('sass') as SassModule
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

export function refreshExtractorNativeClasses(extractor: CSSExtractor, nativeClassNames: string[]) {
    let changed = false
    for (const className of nativeClassNames) {
        if (!extractor.nativeClassNames.has(className)) {
            extractor.nativeClassNames.add(className)
            changed = true
        }
        if (extractor.latentClasses.has(className) && !extractor.usedNativeClasses.has(className)) {
            extractor.usedNativeClasses.add(className)
            changed = true
        }
    }
    if (changed) {
        extractor.emit('change')
    }
}
