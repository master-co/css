import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toHashedManifestAssetFileName } from '@master/css-build-internal/node'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'

function isMasterCSSRenderedHTML(html: string) {
  return new RegExp(String.raw`<style\b(?=[^>]*\bid=(["'])${MASTER_CSS_RUNTIME_STYLE_ID}\1)`, 'i').test(html)
}

function escapeRegExp(source: string) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

function createHydrationManifestScriptPattern(flags: string) {
  return new RegExp(
    String.raw`<script\b(?=[^>]*\bid=(["'])${escapeRegExp(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)}\1)[^>]*>([\s\S]*?)<\/script>`,
    flags
  )
}

function getInlineMasterCSSHydrationManifestJSON(html: string) {
  return html.match(createHydrationManifestScriptPattern('i'))?.[2]?.trim()
}

function externalizeMasterCSSHydrationManifest(html: string, source: string) {
  const stylePattern = new RegExp(
    String.raw`<style\b(?=[^>]*\bid=(["'])${escapeRegExp(MASTER_CSS_RUNTIME_STYLE_ID)}\1)[^>]*>`,
    'i'
  )
  const attributePattern = new RegExp(String.raw`\s${escapeRegExp(MASTER_CSS_HYDRATION_MANIFEST_ATTR)}(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?`, 'i')
  return html
    .replace(createHydrationManifestScriptPattern('gi'), '')
    .replace(stylePattern, (openingTag) => openingTag
      .replace(attributePattern, '')
      .replace(/>$/, ` ${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="${escapeAttributeValue(source)}">`))
}

function toHydrationManifestAssetURL(fileName: string, base = MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE) {
  return `${base.replace(/\/?$/, '/')}${fileName}`
}

async function collectHTMLFiles(dir: string, files: string[] = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const filePath = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name !== '_master-css') await collectHTMLFiles(filePath, files)
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(filePath)
    }
  }
  return files
}

export async function externalizeAstroHydrationManifests(dir: URL | string) {
  const root = typeof dir === 'string' ? dir : fileURLToPath(dir)
  const htmlFiles = await collectHTMLFiles(root)
  const writtenFiles: string[] = []
  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8')
    if (!isMasterCSSRenderedHTML(html)) continue
    const json = getInlineMasterCSSHydrationManifestJSON(html)
    if (!json) continue
    try {
      JSON.parse(json)
    } catch {
      continue
    }
    const fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
    const outputDir = join(root, '_master-css', 'hydration')
    const outputFile = join(outputDir, fileName)
    await mkdir(outputDir, { recursive: true })
    await writeFile(outputFile, json)
    await writeFile(
      htmlFile,
      externalizeMasterCSSHydrationManifest(
        html,
        toHydrationManifestAssetURL(fileName)
      )
    )
    writtenFiles.push(outputFile)
  }
  return writtenFiles
}
