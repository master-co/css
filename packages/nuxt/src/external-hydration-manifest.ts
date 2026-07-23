import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { toHashedManifestAssetFileName } from '@master/css-internal/node'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'

interface NitroPrerenderRoute {
  contents?: string
  contentType?: string
  fileName?: string
}

interface NitroPrerenderContext {
  options: {
    baseURL?: string
    output: {
      publicDir: string
    }
  }
}

function isHTMLPrerenderRoute(route: NitroPrerenderRoute) {
  return route.contentType?.includes('html') || route.fileName?.endsWith('.html')
}

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

function toPublicAssetBase(baseURL = '/') {
  return `${baseURL.replace(/\/?$/, '/')}_master-css/hydration/`
}

function toHydrationManifestAssetURL(
  fileName: string,
  base = MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE
) {
  return `${base.replace(/\/?$/, '/')}${fileName}`
}

export function externalizeNitroPrerenderHydrationManifest(
  route: NitroPrerenderRoute,
  nitro: NitroPrerenderContext
) {
  if (!route.contents || !isHTMLPrerenderRoute(route) || !isMasterCSSRenderedHTML(route.contents)) return
  const json = getInlineMasterCSSHydrationManifestJSON(route.contents)
  if (!json) return
  try {
    JSON.parse(json)
  } catch {
    return
  }
  const fileName = toHashedManifestAssetFileName(
    json,
    MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME
  )
  const filePath = resolve(
    nitro.options.output.publicDir,
    '_master-css',
    'hydration',
    fileName
  )
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, json)
  route.contents = externalizeMasterCSSHydrationManifest(
    route.contents,
    toHydrationManifestAssetURL(fileName, toPublicAssetBase(nitro.options.baseURL))
  )
}
