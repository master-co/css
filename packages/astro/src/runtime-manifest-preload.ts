import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toManifestPreloadLinkTag } from '@master/css-integration/manifest-facade'

const RUNTIME_MANIFEST_REFERENCE_PATTERN = /new URL\((["'])([^"']*master-css-manifest[^"']*\.json)\1\s*,\s*import\.meta\.url\)\.href/g

function escapeRegExp(source: string) {
    return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toRootPath(dir: URL | string) {
    return typeof dir === 'string' ? dir : fileURLToPath(dir)
}

function toPublicBase(base = '/') {
    return `${base || '/'}`.replace(/\/?$/, '/')
}

function toPublicAssetHref(root: string, file: string, base?: string) {
    const outputPath = relative(root, file).split(sep).join('/')
    return `${toPublicBase(base)}${outputPath.replace(/^\/+/, '')}`
}

function hasManifestPreloadLink(html: string, href: string) {
    const quotedHref = escapeRegExp(href)
    return new RegExp(
        String.raw`<link\b(?=[^>]*\brel=(["'])modulepreload\1)(?=[^>]*\bas=(["'])json\2)(?=[^>]*\bhref=(["'])${quotedHref}\3)[^>]*>`,
        'i'
    ).test(html)
}

function escapeAttributeValue(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
}

function hasRuntimeScriptPreloadLink(html: string, href: string) {
    const quotedHref = escapeRegExp(href)
    return new RegExp(
        String.raw`<link\b(?=[^>]*\brel=(["'])modulepreload\1)(?=[^>]*\bhref=(["'])${quotedHref}\2)[^>]*>`,
        'i'
    ).test(html)
}

function toRuntimeScriptPreloadLinkTag(href: string) {
    return `<link rel="modulepreload" crossorigin href="${escapeAttributeValue(href)}">`
}

function injectRuntimePreloads(html: string, runtimeScriptHref: string | undefined, manifestHref: string) {
    const tags: string[] = []
    if (runtimeScriptHref && !hasRuntimeScriptPreloadLink(html, runtimeScriptHref)) {
        tags.push(toRuntimeScriptPreloadLinkTag(runtimeScriptHref))
    }
    if (!hasManifestPreloadLink(html, manifestHref)) {
        tags.push(toManifestPreloadLinkTag(manifestHref))
    }
    if (!tags.length) return html
    return html.replace(/<head\b[^>]*>/i, (openingTag) => `${openingTag}${tags.join('')}`)
}

async function pathExists(file: string) {
    try {
        return (await stat(file)).isFile()
    } catch {
        return false
    }
}

async function collectOutputFiles(dir: string, files: string[] = []) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        const filePath = join(dir, entry.name)
        if (entry.isDirectory()) {
            await collectOutputFiles(filePath, files)
        } else if (entry.isFile()) {
            files.push(filePath)
        }
    }
    return files
}

function isManifestAssetFile(file: string) {
    const name = basename(file)
    return name.startsWith('master-css-manifest') && name.endsWith('.json')
}

async function findReferencedManifestAsset(files: string[]) {
    for (const file of files) {
        if (!file.endsWith('.js')) continue
        const source = await readFile(file, 'utf8')
        for (const match of source.matchAll(RUNTIME_MANIFEST_REFERENCE_PATTERN)) {
            const specifier = match[2]
            if (!specifier) continue
            const manifestFile = join(dirname(file), specifier)
            if (await pathExists(manifestFile)) {
                return {
                    manifestFile,
                    runtimeScriptFile: file
                }
            }
        }
    }
    const manifestFile = files.find(isManifestAssetFile)
    if (!manifestFile) return
    return { manifestFile }
}

export async function preloadAstroRuntimeManifest(dir: URL | string, base?: string) {
    const root = toRootPath(dir)
    const files = await collectOutputFiles(root)
    const assets = await findReferencedManifestAsset(files)
    if (!assets) return []
    const manifestHref = toPublicAssetHref(root, assets.manifestFile, base)
    const runtimeScriptHref = assets.runtimeScriptFile
        ? toPublicAssetHref(root, assets.runtimeScriptFile, base)
        : undefined
    const updatedFiles: string[] = []
    for (const htmlFile of files.filter((file) => file.endsWith('.html'))) {
        const html = await readFile(htmlFile, 'utf8')
        const nextHTML = injectRuntimePreloads(html, runtimeScriptHref, manifestHref)
        if (nextHTML === html) continue
        await writeFile(htmlFile, nextHTML)
        updatedFiles.push(htmlFile)
    }
    return updatedFiles
}
