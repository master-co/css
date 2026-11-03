import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { createServerRenderer } from '@master/css-server'
import type { NextAdapter } from 'next'
import { MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME } from '@master/css-schema/hydration-manifest'
import { toHashedManifestAssetFileName } from '@master/css-internal/node'
import { getRegisteredOptions, resolveOptions, type MasterCSSNextAdapterOrder, type MasterCSSNextOptions } from './options'
import { createMasterCSSBuildStateResolver } from './build-state'
import { describeLinkedStylesheets } from './linked-stylesheets'

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
  order?: MasterCSSNextAdapterOrder
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
    throw new Error(`[@master/css-next] Cannot resolve the static export root from output id ${JSON.stringify(output.id)} and file path ${JSON.stringify(output.filePath)}.`)
  }

  let exportRoot = resolve(output.filePath)
  for (const _segment of idSegments) exportRoot = dirname(exportRoot)

  const expectedFilePath = resolve(exportRoot, ...idSegments)
  if (dirname(exportRoot) === exportRoot || expectedFilePath !== resolve(output.filePath)) {
    throw new Error(`[@master/css-next] Cannot resolve the static export root from output id ${JSON.stringify(output.id)} and file path ${JSON.stringify(output.filePath)}.`)
  }

  return exportRoot
}

function toNextHydrationManifestFilePath(ctx: BuildCompleteContext, output: HTMLBuildOutput, fileName: string) {
  if (ctx.config.output === 'export') {
    return join(resolveStaticExportRoot(output), '_next', 'static', 'master-css', 'hydration', fileName)
  }
  return join(ctx.distDir, 'static', 'master-css', 'hydration', fileName)
}

export async function renderNextBuildOutputs(ctx: BuildCompleteContext, rawOptions: MasterCSSNextOptions = getRegisteredOptions() ?? {}) {
  const options = resolveOptions(rawOptions)
  if (!options.enabled) return []
  if (options.mode === 'runtime') return []
  const stylesheets = await describeLinkedStylesheets(ctx)

  const buildStateResolver = await createMasterCSSBuildStateResolver(ctx.projectDir, { pruneNativeCSS: options.pruneNativeCSS })
  let renderer: ReturnType<typeof createServerRenderer> | undefined
  try {
    const baseBuildState = await buildStateResolver.resolve()
    renderer = createServerRenderer({
      manifest: baseBuildState.manifest,
      emittedGlobals: baseBuildState.emittedGlobals,
      maxCachedClasses: Infinity
    })
    const htmlOutputs = collectHTMLBuildOutputs(ctx.outputs)
    const renderedOutputs: RenderedOutput[] = []
    const hydrationManifestAssets = new Set<string>()

    for (const output of htmlOutputs) {
      const sourceHTML = await readFile(output.filePath, 'utf-8')
      let hydrationManifestJSON: string | undefined
      let hydrationManifestFile: string | undefined
      let hydrationManifestBytes = 0
      // The server writes the escaped <style> and replaces the inline manifest
      // through its DOM; rewriting the HTML text here would undo that escaping.
      const rendered = renderer.renderHTML(sourceHTML, {
        stylesheets,
        ...(options.mode === 'progressive'
          ? {
            hydrationManifest: {
              type: 'external' as const,
              source: (json: string) => {
                const fileName = toHashedManifestAssetFileName(json, MASTER_CSS_HYDRATION_MANIFEST_FILE_BASENAME)
                hydrationManifestJSON = json
                hydrationManifestFile = toNextHydrationManifestFilePath(ctx, output, fileName)
                return toNextHydrationManifestPublicURL(ctx, fileName)
              }
            }
          }
          : {})
      })
      if (hydrationManifestJSON && hydrationManifestFile) {
        hydrationManifestBytes = Buffer.byteLength(hydrationManifestJSON)
        if (!hydrationManifestAssets.has(hydrationManifestFile)) {
          await mkdir(dirname(hydrationManifestFile), { recursive: true })
          await writeFile(hydrationManifestFile, hydrationManifestJSON)
          hydrationManifestAssets.add(hydrationManifestFile)
        }
      }
      const generatedCSS = rendered.cssText
      const renderedHTML = rendered.html
      const didRender = renderedHTML !== sourceHTML

      if (didRender) {
        await writeFile(output.filePath, renderedHTML)
      }

      renderedOutputs.push({
        file: output.filePath,
        pathname: output.pathname,
        source: output.source,
        classes: [...rendered.classNames],
        cssBytes: Buffer.byteLength(generatedCSS),
        hydrationManifestBytes,
        hydrationManifestFile,
        rendered: didRender
      })
    }

    await writeBuildReport(ctx, renderedOutputs, options.buildReport)

    if (options.debug) {
      const renderedCount = renderedOutputs.filter((output) => output.rendered).length
      console.log(`[@master/css-next] rendered ${renderedCount}/${renderedOutputs.length} HTML output(s)`)
    }

    return renderedOutputs
  } finally {
    renderer?.dispose()
    await buildStateResolver.dispose()
  }
}

export function createAdapter(options?: MasterCSSNextOptions): NextAdapter {
  return {
    name: '@master/css-next',
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
    name: '@master/css-next+adapter',
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
