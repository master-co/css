import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { createServerRenderer } from '@master/css-server'
import type { NextAdapter } from 'next'
import { MASTER_CSS_RUNTIME_STYLE_ID } from '@master/css-schema/runtime-style'
import {
  MASTER_CSS_HYDRATION_MANIFEST_ATTR,
  MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME,
  MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID,
  serializeMasterCSSHydrationManifest
} from '@master/css-schema/hydration-manifest'
import { toHashedManifestAssetFileName } from '@master/css-integration/node'
import { getRegisteredOptions, resolveOptions, type AdapterOrder, type Options } from './options'
import { createMasterCSSBuildStateResolver } from './build-state'

type BuildCompleteContext = Parameters<NonNullable<NextAdapter['onBuildComplete']>>[0]
type BuildOutputs = BuildCompleteContext['outputs']
type AdapterModule = NextAdapter | { default?: NextAdapter }
type AdapterLoader = AdapterModule | (() => AdapterModule | Promise<AdapterModule>)

interface HTMLBuildOutput {
  id: string
  filePath: string
  pathname: string
  source: 'static' | 'prerender-fallback'
}

interface RenderedHTMLBuildOutput {
  output: HTMLBuildOutput
  sourceHTML: string
  renderedHTML: string
  classes: string[]
  cssBytes: number
  hydrationManifestBytes: number
  hydrationManifestFile?: string
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface RenderedOutput {
  file: string
  pathname: string
  source: HTMLBuildOutput['source']
  classes: string[]
  cssBytes: number
  hydrationManifestBytes: number
  hydrationManifestFile?: string
  rendered: boolean
}

export interface BuildReport {
  version: 1
  nextVersion: string
  buildId: string
  files: RenderedOutput[]
}

export interface ComposedAdapterOptions {
  order?: AdapterOrder
}

function isHTMLFile(filePath: string | undefined): filePath is string {
  if (!filePath) return false
  return ['.html', '.htm'].includes(extname(filePath).toLowerCase())
}

function collectHTMLBuildOutputs(outputs: BuildOutputs): HTMLBuildOutput[] {
  const htmlOutputs: HTMLBuildOutput[] = []
  const seen = new Set<string>()

  function add(output: HTMLBuildOutput) {
    if (seen.has(output.filePath)) return
    seen.add(output.filePath)
    htmlOutputs.push(output)
  }

  for (const output of outputs.staticFiles) {
    if (isHTMLFile(output.filePath)) {
      add({
        id: output.id,
        filePath: output.filePath,
        pathname: output.pathname,
        source: 'static'
      })
    }
  }

  for (const output of outputs.prerenders) {
    if (isHTMLFile(output.fallback?.filePath)) {
      add({
        id: output.id,
        filePath: output.fallback.filePath,
        pathname: output.pathname,
        source: 'prerender-fallback'
      })
    }
  }

  return htmlOutputs
}

async function writeBuildReport(ctx: BuildCompleteContext, files: RenderedOutput[], buildReport: boolean | string) {
  if (!buildReport) return
  const buildReportPath = typeof buildReport === 'string'
    ? resolve(ctx.distDir, buildReport)
    : join(ctx.distDir, 'master-css-build-report.json')
  const data: BuildReport = {
    version: 1,
    nextVersion: ctx.nextVersion,
    buildId: ctx.buildId,
    files
  }
  await mkdir(dirname(buildReportPath), { recursive: true })
  await writeFile(buildReportPath, JSON.stringify(data, null, 2))
}

function createMasterStyleText(cssText: string) {
  return `<style id="${MASTER_CSS_RUNTIME_STYLE_ID}">${cssText}</style>`
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

function upsertAttribute(openingTag: string, name: string, value: string) {
  const attributePattern = new RegExp(String.raw`\s${escapeRegExp(name)}(?:=(?:"[^"]*"|'[^']*'|[^\s>]*))?`, 'i')
  return openingTag
    .replace(attributePattern, '')
    .replace(/>$/, ` ${name}="${escapeAttributeValue(value)}">`)
}

function removeHydrationManifestScripts(html: string) {
  const scriptPattern = new RegExp(
    String.raw`<script\b(?=[^>]*\bid=(["'])${escapeRegExp(MASTER_CSS_HYDRATION_MANIFEST_SCRIPT_ID)}\1)[^>]*>[\s\S]*?<\/script>`,
    'gi'
  )
  return html.replace(scriptPattern, '')
}

function attachHydrationManifestSource(html: string, source: string) {
  const stylePattern = new RegExp(
    String.raw`<style\b(?=[^>]*\bid=(["'])${escapeRegExp(MASTER_CSS_RUNTIME_STYLE_ID)}\1)[^>]*>`,
    'i'
  )
  return removeHydrationManifestScripts(html).replace(
    stylePattern,
    (openingTag) => upsertAttribute(openingTag, MASTER_CSS_HYDRATION_MANIFEST_ATTR, source)
  )
}

function toNextHydrationManifestPublicURL(ctx: BuildCompleteContext, fileName: string) {
  const config = ctx.config as { assetPrefix?: string, basePath?: string }
  const pathname = `${config.basePath || ''}/_next/static/master-css/hydration/${fileName}`
  return config.assetPrefix
    ? `${config.assetPrefix.replace(/\/$/, '')}${pathname.startsWith('/') ? pathname : '/' + pathname}`
    : pathname
}

function resolveStaticExportRoot(output: HTMLBuildOutput) {
  const normalizedID = output.id.replaceAll('\\', '/')
  const relativeID = normalizedID.startsWith('/') ? normalizedID.slice(1) : normalizedID
  const idSegments = relativeID.split('/').filter((segment) => segment && segment !== '.')
  if (
    !idSegments.length
    || normalizedID.startsWith('//')
    || /^[a-z]:\//i.test(relativeID)
    || idSegments.includes('..')
  ) {
    throw new Error(`[@master/css.next] Cannot resolve the static export root from output id ${JSON.stringify(output.id)} and file path ${JSON.stringify(output.filePath)}.`)
  }

  let exportRoot = resolve(output.filePath)
  for (const _segment of idSegments) exportRoot = dirname(exportRoot)

  const expectedFilePath = resolve(exportRoot, ...idSegments)
  if (dirname(exportRoot) === exportRoot || expectedFilePath !== resolve(output.filePath)) {
    throw new Error(`[@master/css.next] Cannot resolve the static export root from output id ${JSON.stringify(output.id)} and file path ${JSON.stringify(output.filePath)}.`)
  }

  return exportRoot
}

function toNextHydrationManifestFilePath(ctx: BuildCompleteContext, output: HTMLBuildOutput, fileName: string) {
  if (ctx.config.output === 'export') {
    return join(resolveStaticExportRoot(output), '_next', 'static', 'master-css', 'hydration', fileName)
  }
  return join(ctx.distDir, 'static', 'master-css', 'hydration', fileName)
}

function upsertMasterStyleText(html: string, cssText: string) {
  const stylePattern = new RegExp(`(<style\\b(?=[^>]*\\bid=(["'])${escapeRegExp(MASTER_CSS_RUNTIME_STYLE_ID)}\\2)[^>]*>)([\\s\\S]*?)(<\\/style>)`)
  if (stylePattern.test(html)) {
    return html.replace(
      stylePattern,
      (_match, open: string, _quote: string, _content: string, close: string) => open + cssText + close
    )
  }
  const headCloseIndex = html.search(/<\/head\s*>/i)
  const styleText = createMasterStyleText(cssText)
  return headCloseIndex === -1
    ? styleText + html
    : html.slice(0, headCloseIndex) + styleText + html.slice(headCloseIndex)
}

export async function renderNextBuildOutputs(ctx: BuildCompleteContext, rawOptions: Options = getRegisteredOptions() ?? {}) {
  const options = resolveOptions(rawOptions)
  if (options.mode === null) return []

  const buildStateResolver = await createMasterCSSBuildStateResolver(ctx.projectDir)
  let renderer: ReturnType<typeof createServerRenderer> | undefined
  try {
    const baseBuildState = await buildStateResolver.resolve()
    renderer = createServerRenderer(baseBuildState.manifest, { maxCachedClasses: Infinity })
    const htmlOutputs = collectHTMLBuildOutputs(ctx.outputs)
    const renderedHTMLOutputs: RenderedHTMLBuildOutput[] = []
    const renderedOutputs: RenderedOutput[] = []
    const hydrationManifestAssets = new Map<string, string>()

    for (const output of htmlOutputs) {
      const sourceHTML = await readFile(output.filePath, 'utf-8')
      let hydrationManifestFile: string | undefined
      let hydrationManifestBytes = 0
      const rendered = renderer.render(sourceHTML)
      try {
        if (rendered.hydrationManifest?.rules.length) {
          const json = serializeMasterCSSHydrationManifest(rendered.hydrationManifest)
          const fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
          hydrationManifestFile = toNextHydrationManifestFilePath(ctx, output, fileName)
          hydrationManifestBytes = Buffer.byteLength(json)
          hydrationManifestAssets.set(hydrationManifestFile, json)
        }
        const generatedCSS = rendered.css?.classUtilities.size ? rendered.css.text : ''
        let renderedHTML = generatedCSS
          ? upsertMasterStyleText(rendered.html, generatedCSS)
          : sourceHTML
        if (generatedCSS && hydrationManifestFile) {
          renderedHTML = attachHydrationManifestSource(
            renderedHTML,
            toNextHydrationManifestPublicURL(ctx, basename(hydrationManifestFile))
          )
        }
        renderedHTMLOutputs.push({
          output,
          sourceHTML,
          renderedHTML,
          classes: rendered.classes,
          cssBytes: Buffer.byteLength(generatedCSS),
          hydrationManifestBytes,
          hydrationManifestFile
        })
      } finally {
        rendered.css?.dispose()
      }
    }

    for (const [filePath, source] of hydrationManifestAssets) {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, source)
    }

    for (const {
      output,
      sourceHTML,
      renderedHTML,
      classes,
      cssBytes,
      hydrationManifestBytes,
      hydrationManifestFile
    } of renderedHTMLOutputs) {
      const didRender = renderedHTML !== sourceHTML

      if (didRender) {
        await writeFile(output.filePath, renderedHTML)
      }

      renderedOutputs.push({
        file: output.filePath,
        pathname: output.pathname,
        source: output.source,
        classes,
        cssBytes,
        hydrationManifestBytes,
        hydrationManifestFile,
        rendered: didRender
      })
    }

    await writeBuildReport(ctx, renderedOutputs, options.buildReport)

    if (options.debug) {
      const renderedCount = renderedOutputs.filter((output) => output.rendered).length
      console.log(`[@master/css.next] rendered ${renderedCount}/${renderedOutputs.length} HTML output(s)`)
    }

    return renderedOutputs
  } finally {
    renderer?.dispose()
    await buildStateResolver.destroy()
  }
}

export function createAdapter(options?: Options): NextAdapter {
  return {
    name: '@master/css.next',
    async onBuildComplete(ctx) {
      await renderNextBuildOutputs(ctx, options ?? getRegisteredOptions() ?? {})
    }
  }
}

async function resolveAdapter(adapter: AdapterLoader) {
  const loadedAdapter = typeof adapter === 'function'
    ? await adapter()
    : adapter
  return ('default' in loadedAdapter && loadedAdapter.default)
    ? loadedAdapter.default
    : loadedAdapter as NextAdapter
}

export function createComposedAdapter(
  masterAdapter: NextAdapter,
  externalAdapter: AdapterLoader,
  { order = 'master-first' }: ComposedAdapterOptions = {}
): NextAdapter {
  return {
    name: '@master/css.next+adapter',
    async onBuildComplete(ctx) {
      const resolvedExternalAdapter = await resolveAdapter(externalAdapter)
      const adapters = order === 'master-first'
        ? [masterAdapter, resolvedExternalAdapter]
        : [resolvedExternalAdapter, masterAdapter]
      for (const adapter of adapters) {
        await adapter.onBuildComplete?.(ctx)
      }
    }
  }
}

export default createAdapter()
