import { readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toProgramPreloadLinkTag } from '@master/css-internal/program-module'

const RUNTIME_PROGRAM_REFERENCE_PATTERN = /new URL\((["'])([^"']*master-css-program[^"']*\.bin)\1\s*,\s*import\.meta\.url\)\.href/g

function escapeRegExp(source: string) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toRootPath(dir: URL | string) {
  return typeof dir === 'string' ? dir : fileURLToPath(dir)
}

function toPublicBase(base = '/') {
  return `${base || '/'}`.replace(/\/?$/, '/')
}

/** Astro's `build.assetsPrefix`: one origin, or one per file extension with a fallback. */
export type AstroAssetsPrefix = string | ({ fallback: string } & Record<string, string>)

// Link built assets the way Astro links its own scripts and stylesheets, so the
// preload is the request the page makes.
function toPublicAssetHref(root: string, file: string, base?: string, assetsPrefix?: AstroAssetsPrefix) {
  const outputPath = relative(root, file).split(sep).join('/').replace(/^\/+/, '')
  const prefix = typeof assetsPrefix === 'string'
    ? assetsPrefix
    : assetsPrefix && (assetsPrefix[file.slice(file.lastIndexOf('.') + 1)] || assetsPrefix.fallback)
  if (prefix) return `${prefix.replace(/\/+$/, '')}/${outputPath}`
  return `${toPublicBase(base)}${outputPath}`
}

function hasProgramPreloadLink(html: string, href: string) {
  const quotedHref = escapeRegExp(href)
  return new RegExp(
    String.raw`<link\b(?=[^>]*\brel=(["'])preload\1)(?=[^>]*\bas=(["'])fetch\2)(?=[^>]*\bhref=(["'])${quotedHref}\3)[^>]*>`,
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

function injectRuntimePreloads(
  html: string,
  runtimeScriptHref: string | undefined,
  programHref: string
) {
  const tags: string[] = []
  if (runtimeScriptHref && !hasRuntimeScriptPreloadLink(html, runtimeScriptHref)) {
    tags.push(toRuntimeScriptPreloadLinkTag(runtimeScriptHref))
  }
  if (!hasProgramPreloadLink(html, programHref)) {
    tags.push(toProgramPreloadLinkTag(programHref))
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

function isProgramAssetFile(file: string) {
  const name = basename(file)
  return name.startsWith('master-css-program') && name.endsWith('.bin')
}

async function findRuntimePreloadAssets(files: string[]) {
  for (const file of files) {
    if (!file.endsWith('.js')) continue
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(RUNTIME_PROGRAM_REFERENCE_PATTERN)) {
      const specifier = match[2]
      if (!specifier) continue
      const programFile = join(dirname(file), specifier)
      if (await pathExists(programFile)) {
        return {
          programFile,
          runtimeScriptFile: file
        }
      }
    }
  }
  const programFile = files.find(isProgramAssetFile)
  if (!programFile) return
  return { programFile }
}

export async function preloadAstroRuntimeAssets(dir: URL | string, base?: string, assetsPrefix?: AstroAssetsPrefix) {
  const root = toRootPath(dir)
  const files = await collectOutputFiles(root)
  const assets = await findRuntimePreloadAssets(files)
  if (!assets) return []
  const programHref = toPublicAssetHref(root, assets.programFile, base, assetsPrefix)
  const runtimeScriptHref = assets.runtimeScriptFile
    ? toPublicAssetHref(root, assets.runtimeScriptFile, base, assetsPrefix)
    : undefined
  const updatedFiles: string[] = []
  for (const htmlFile of files.filter((file) => file.endsWith('.html'))) {
    const html = await readFile(htmlFile, 'utf8')
    const nextHTML = injectRuntimePreloads(html, runtimeScriptHref, programHref)
    if (nextHTML === html) continue
    await writeFile(htmlFile, nextHTML)
    updatedFiles.push(htmlFile)
  }
  return updatedFiles
}
