import type { MasterCSSEmittedGlobals, MasterCSSManifest } from '@master/css'
import { createServerCSS, parseHTML, type ServerCSS } from '@master/css-server'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE,
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME,
  createMasterCSSHydrationManifestScript,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
  serializeMasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import { escapeRegExp } from '@master/css-lexer'
import type { Handle } from '@sveltejs/kit'
import { toHashedManifestAssetFileName } from '@master/css-integration/node'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const HEAD_CLOSE_TAG = '</head>'
const HEAD_CLOSE_TAIL_LENGTH = HEAD_CLOSE_TAG.length - 1
const MASTER_STYLE_PATTERN = new RegExp(
  `<style\\b(?=[^>]*\\bid=(["'])${escapeRegExp(MASTER_CSS_RUNTIME_STYLE_ID)}\\1)[^>]*>[\\s\\S]*?<\\/style>`,
  'i'
)
const MASTER_RUNTIME_MANIFEST_PATTERN = new RegExp(
  `<script\\b(?=[^>]*\\bid=(["'])${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}\\1)[^>]*>[\\s\\S]*?<\\/script>`,
  'i'
)
const MASTER_RUNTIME_MANIFEST_PATTERN_GLOBAL = new RegExp(
  `<script\\b(?=[^>]*\\bid=(["'])${MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID}\\1)[^>]*>[\\s\\S]*?<\\/script>`,
  'gi'
)

export type MasterCSSSvelteHydrationManifestOption =
  | 'inline'
  | false
  | {
    type: 'external'
    write: (json: string, hash: string) => string
  }

export interface MasterCSSSvelteHandleOptions {
  manifest: MasterCSSManifest
  hydrationManifest?: MasterCSSSvelteHydrationManifestOption
  emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSSvelteChunkRendererOptions {
  hydrationManifest?: MasterCSSSvelteHydrationManifestOption
  emittedGlobals?: MasterCSSEmittedGlobals
}

export interface MasterCSSChunkRenderer {
  css: ServerCSS
  transform(html: string, done?: boolean): string
}

export interface MasterCSSStaticHydrationManifestWriterOptions {
  outDir: string
  base?: string
}

interface MasterCSSHydrationManifestInjection {
  scriptText?: string
  source?: string
}

function findHeadCloseIndex(html: string) {
  return html.toLowerCase().indexOf(HEAD_CLOSE_TAG)
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

function createMasterStyle(cssText: string, hydrationManifestSource?: string) {
  return hydrationManifestSource
    ? `<style id="${MASTER_CSS_RUNTIME_STYLE_ID}" ${MASTER_CSS_HYDRATION_MANIFEST_ATTR}="${escapeAttributeValue(hydrationManifestSource)}">${cssText}</style>`
    : `<style id="${MASTER_CSS_RUNTIME_STYLE_ID}">${cssText}</style>`
}

function getHydrationManifestHash(fileName: string) {
  return fileName.slice(
    MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME.length + 1,
    -'.json'.length
  )
}

function toHydrationManifestAssetURL(fileName: string, base = MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE) {
  return `${base.replace(/\/?$/, '/')}${fileName}`
}

function createMasterHydrationManifest(
  css: ServerCSS,
  option: MasterCSSSvelteHydrationManifestOption = 'inline'
): MasterCSSHydrationManifestInjection {
  const hydrationManifest = css.hydrationManifest
  if (!hydrationManifest.rules.length || option === false) return {}
  if (typeof option === 'object' && option.type === 'external') {
    const json = serializeMasterCSSHydrationManifest(hydrationManifest)
    const fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
    return {
      source: option.write(json, getHydrationManifestHash(fileName))
    }
  }
  return {
    scriptText: createMasterCSSHydrationManifestScript(hydrationManifest)
  }
}

export function collectMasterCSSClasses(css: ServerCSS, html: string) {
  for (const className of parseHTML(html).classes) {
    css.ensureClassRules(className)
  }
}

function injectMasterHydrationManifest(html: string, scriptText: string) {
  if (!scriptText) return html
  if (MASTER_RUNTIME_MANIFEST_PATTERN.test(html)) {
    return html.replace(MASTER_RUNTIME_MANIFEST_PATTERN, () => scriptText)
  }
  const headCloseIndex = findHeadCloseIndex(html)
  if (headCloseIndex === -1) return html
  return html.slice(0, headCloseIndex) + scriptText + html.slice(headCloseIndex)
}

function removeMasterHydrationManifest(html: string) {
  return html.replace(MASTER_RUNTIME_MANIFEST_PATTERN_GLOBAL, '')
}

export function injectMasterStyle(
  html: string,
  cssText: string,
  manifestScriptText = '',
  hydrationManifestSource?: string
) {
  if (!cssText) return html
  const style = createMasterStyle(cssText, hydrationManifestSource)
  let nextHTML: string
  if (MASTER_STYLE_PATTERN.test(html)) {
    nextHTML = html.replace(MASTER_STYLE_PATTERN, () => style)
  } else {
    const headCloseIndex = findHeadCloseIndex(html)
    if (headCloseIndex === -1) return html
    nextHTML = html.slice(0, headCloseIndex) + style + html.slice(headCloseIndex)
  }
  if (hydrationManifestSource) return removeMasterHydrationManifest(nextHTML)
  return injectMasterHydrationManifest(nextHTML, manifestScriptText)
}

export function createMasterCSSStaticHydrationManifestWriter({
  outDir,
  base = MASTER_CSS_HYDRATION_MANIFEST_ASSET_BASE
}: MasterCSSStaticHydrationManifestWriterOptions) {
  return (json: string, hash: string) => {
    const fileName = `${MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME}.${hash}.json`
    const dir = join(outDir, '_master-css', 'hydration')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, fileName), json)
    return toHydrationManifestAssetURL(fileName, base)
  }
}

function isMasterCSSSvelteChunkRendererOptions(
  options: MasterCSSSvelteHydrationManifestOption | MasterCSSSvelteChunkRendererOptions | undefined
): options is MasterCSSSvelteChunkRendererOptions {
  return !!options
    && typeof options === 'object'
    && !('type' in options)
}

export function createMasterCSSChunkRenderer(
  manifest: MasterCSSManifest,
  hydrationManifest?: MasterCSSSvelteHydrationManifestOption
): MasterCSSChunkRenderer
export function createMasterCSSChunkRenderer(
  manifest: MasterCSSManifest,
  options?: MasterCSSSvelteChunkRendererOptions
): MasterCSSChunkRenderer
export function createMasterCSSChunkRenderer(
  manifest: MasterCSSManifest,
  options: MasterCSSSvelteHydrationManifestOption | MasterCSSSvelteChunkRendererOptions = 'inline'
): MasterCSSChunkRenderer {
  const rendererOptions = isMasterCSSSvelteChunkRendererOptions(options)
    ? options
    : { hydrationManifest: options }
  const hydrationManifest = rendererOptions.hydrationManifest ?? 'inline'
  const css = createServerCSS(manifest, rendererOptions.emittedGlobals)
  let injected = false
  let carry = ''

  return {
    css,
    transform(html, done = false) {
      const nextHTML = carry + html
      carry = ''

      if (injected) return nextHTML

      collectMasterCSSClasses(css, nextHTML)

      const hydration = createMasterHydrationManifest(css, hydrationManifest)
      const transformedHTML = injectMasterStyle(nextHTML, css.text, hydration.scriptText, hydration.source)
      const hasHeadClose = findHeadCloseIndex(nextHTML) !== -1
      if (transformedHTML !== nextHTML || hasHeadClose) {
        injected = true
        return transformedHTML
      }

      if (done || nextHTML.length <= HEAD_CLOSE_TAIL_LENGTH) {
        return nextHTML
      }

      carry = nextHTML.slice(-HEAD_CLOSE_TAIL_LENGTH)
      return nextHTML.slice(0, -HEAD_CLOSE_TAIL_LENGTH)
    }
  }
}

export function createMasterCSSHandle(options: MasterCSSSvelteHandleOptions): Handle {
  return async ({ event, resolve }) => {
    const renderer = createMasterCSSChunkRenderer(options.manifest, {
      hydrationManifest: options.hydrationManifest,
      emittedGlobals: options.emittedGlobals
    })
    return await resolve(event, {
      transformPageChunk: ({ html, done }) => renderer.transform(html, done)
    })
  }
}
