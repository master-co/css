import type { Plugin } from 'vite'
import {
    MANIFEST_ASSET_FILE,
    toManifestPreloadLinkAttrs
} from '@master/css-integration/manifest-facade'
import type { PluginContext } from '../core'

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function splitPathSegments(path: string) {
    return path.split('/').filter(Boolean)
}

function getHTMLDirectorySegments(path = '/index.html') {
    const cleanPath = path.split(/[?#]/)[0] || '/index.html'
    const segments = splitPathSegments(cleanPath)
    if (!cleanPath.endsWith('/')) segments.pop()
    return segments
}

function toRelativeAssetHref(fileName: string, htmlPath?: string) {
    const fromSegments = getHTMLDirectorySegments(htmlPath)
    const toSegments = splitPathSegments(fileName)
    let common = 0
    while (
        common < fromSegments.length
        && common < toSegments.length
        && fromSegments[common] === toSegments[common]
    ) {
        common += 1
    }
    return [
        ...Array.from({ length: fromSegments.length - common }, () => '..'),
        ...toSegments.slice(common)
    ].join('/') || '.'
}

function toAssetHref(fileName: string, base = '/', htmlPath?: string) {
    const normalizedFileName = fileName.replace(/^\/+/, '')
    if (base && base !== './') {
        return `${base.replace(/\/?$/, '/')}${normalizedFileName}`
    }
    return toRelativeAssetHref(normalizedFileName, htmlPath)
}

function hasManifestPreloadLink(html: string, href: string) {
    const quotedHref = escapeRegExp(href)
    return new RegExp(
        String.raw`<link\b(?=[^>]*\brel=(["'])preload\1)(?=[^>]*\bas=(["'])fetch\2)(?=[^>]*\bhref=(["'])${quotedHref}\3)[^>]*>`,
        'i'
    ).test(html)
}

interface OutputAssetLike {
    type: string
    name?: string
    names?: string[]
    fileName?: string
    source?: unknown
}

function findDefaultManifestAssetFileName(context: PluginContext, bundle: Record<string, OutputAssetLike>) {
    const source = context.defaultManifestAssetSource
    if (!source) return
    for (const output of Object.values(bundle)) {
        if (
            output.type === 'asset'
            && (output.name === MANIFEST_ASSET_FILE || output.names?.includes(MANIFEST_ASSET_FILE))
            && output.source === source
        ) {
            return output.fileName
        }
    }
}

export default function ManifestPreloadPlugin(context: PluginContext): Plugin {
    return {
        name: 'master-css:manifest-preload',
        apply: 'build',
        transformIndexHtml: {
            order: 'post',
            handler(html, htmlContext) {
                if (!context.defaultManifestAssetReferenceId || !htmlContext.bundle) return
                const fileName = findDefaultManifestAssetFileName(context, htmlContext.bundle as Record<string, OutputAssetLike>)
                if (!fileName) return
                const href = toAssetHref(fileName, context.config?.base, htmlContext.path)
                if (hasManifestPreloadLink(html, href)) return
                return {
                    html,
                    tags: [
                        {
                            tag: 'link',
                            attrs: { ...toManifestPreloadLinkAttrs(href) },
                            injectTo: 'head-prepend'
                        }
                    ]
                }
            }
        }
    }
}
