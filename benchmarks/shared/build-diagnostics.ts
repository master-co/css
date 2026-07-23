import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { MasterCSSScanner } from '@master/css-tooling/scanner/node'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import {
  createStylesheetCollection
} from '@master/css-compiler/stylesheet'
import { discoverManifestEntries } from '@master/css-compiler/project'
import fg from 'fast-glob'
import { getStaticFixtureSource } from '../fixtures/static'
import { summarizeBytes } from './bytes'
import {
  findCSSFiles,
  measureRelativeArtifact,
  readFiles,
  resetDirectory,
  writeWorkspaceFiles
} from './runner'
import {
  addViteEntryScript,
  prepareStaticWorkspace,
  staticBuildTools
} from './static-build'
import type {
  BenchmarkArtifact,
  BenchmarkFixtureId,
  BenchmarkSample,
  BenchmarkVariant,
  ByteSummary
} from './types'

const defaultManifest = defaultManifestJSON as unknown as MasterCSSManifest

export type DiagnosticToolId = 'master-cli-diagnostic' | 'master-vite-diagnostic'
type VitePlugin = {
  name?: string
  transformIndexHtml?: unknown
  [key: string]: unknown
}
type ViteBuild = (options: Record<string, unknown>) => Promise<unknown>
type MasterCSSVite = (options: Record<string, unknown>) => VitePlugin[]

const dynamicImport = new Function('specifier', 'return import(specifier)') as <T>(specifier: string) => Promise<T>

export interface BuildDiagnosticResult {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

interface DiagnosticRunResult {
  measurements: Record<string, number>
  artifacts: BenchmarkArtifact[]
  cssBytes: ByteSummary
}

class DiagnosticRecorder {
  readonly timings: Record<string, number> = {}
  readonly counts: Record<string, number> = {}

  async time<T>(metricId: string, callback: () => Promise<T> | T): Promise<T> {
    const startedAt = performance.now()
    try {
      return await callback()
    } finally {
      this.addTiming(metricId, performance.now() - startedAt)
    }
  }

  addTiming(metricId: string, value: number) {
    this.timings[metricId] = (this.timings[metricId] || 0) + value
  }

  addCount(metricId: string, value = 1) {
    this.counts[metricId] = (this.counts[metricId] || 0) + value
  }

  setCount(metricId: string, value: number) {
    this.counts[metricId] = value
  }

  entries() {
    return {
      ...this.timings,
      ...this.counts
    }
  }
}

export const buildDiagnosticMetricIds = [
  'total-diagnostic-ms',
  'generated-css-raw-bytes',
  'generated-css-gzip-bytes',
  'generated-css-brotli-bytes',
  'source-file-count',
  'css-entry-count',
  'cli-scanner-init-ms',
  'cli-css-entry-register-ms',
  'cli-source-glob-ms',
  'cli-source-scan-ms',
  'cli-css-extraction-ms',
  'cli-file-write-ms',
  'vite-baseline-build-ms',
  'vite-total-build-ms',
  'vite-master-scanner-init-ms',
  'vite-master-html-scan-ms',
  'vite-master-module-scan-ms',
  'vite-master-style-entry-ms',
  'vite-master-generate-bundle-ms'
] as const

export function createBuildDiagnosticVariants(fixtureIds: BenchmarkFixtureId[]): BenchmarkVariant[] {
  return fixtureIds.flatMap((fixtureId) => [
    {
      id: createBuildDiagnosticVariantId(fixtureId, 'master-cli-diagnostic'),
      fixtureId,
      adapterId: 'master-static',
      label: `${fixtureId} / Master CSS CLI diagnostic`,
      limits: ['Diagnostic timings mirror CLI internals and are not identical to full child-process command timings.']
    },
    {
      id: createBuildDiagnosticVariantId(fixtureId, 'master-vite-diagnostic'),
      fixtureId,
      adapterId: 'master-static',
      label: `${fixtureId} / Master CSS Vite diagnostic`,
      limits: ['Diagnostic timings instrument Vite plugin hooks and are not identical to full child-process command timings.']
    }
  ])
}

export function createBuildDiagnosticVariantId(fixtureId: BenchmarkFixtureId, toolId: DiagnosticToolId) {
  return `${fixtureId}-${toolId}`
}

export async function runBuildDiagnostic(options: {
  workspace: string
  fixtureId: BenchmarkFixtureId
  toolId: DiagnosticToolId
  variantId: string
  round: number
}): Promise<BuildDiagnosticResult> {
  const result = options.toolId === 'master-cli-diagnostic'
    ? await runMasterCLIDiagnostic(options.workspace, options.fixtureId)
    : await runMasterViteDiagnostic(options.workspace, options.fixtureId)

  return {
    samples: createDiagnosticSamples(options.variantId, options.round, result),
    artifacts: result.artifacts
  }
}

async function runMasterCLIDiagnostic(workspace: string, fixtureId: BenchmarkFixtureId): Promise<DiagnosticRunResult> {
  const tool = staticBuildTools.find((candidate) => candidate.id === 'master-static-cli')
  if (!tool) throw new Error('Missing Master CSS static CLI tool.')

  await prepareStaticWorkspace(workspace, fixtureId, tool)

  const recorder = new DiagnosticRecorder()
  const totalStartedAt = performance.now()
  const stylesheets = createStylesheetCollection()
  const scanner = new MasterCSSScanner({ manifest: defaultManifest }, workspace)

  await recorder.time('cli-scanner-init-ms', async () => {
    await scanner.init()
    scanner.options.verbose = 0
  })

  await recorder.time('cli-css-entry-register-ms', async () => {
    stylesheets.clear()
    const entries = await discoverManifestEntries({ root: scanner.cwd })
    recorder.setCount('css-entry-count', entries.length)
    for (const entry of entries) {
      await stylesheets.register(scanner, entry, await readFile(entry, 'utf8'), {
        baseManifest: defaultManifest,
        projectDir: scanner.cwd
      })
    }
    scanner.resetDependencies = [...stylesheets.snapshot().dependencies]
  })

  const sourcePaths = await recorder.time('cli-source-glob-ms', () => fg(['index.html'], {
    cwd: scanner.cwd
  }))
  recorder.setCount('source-file-count', sourcePaths.length)

  await recorder.time('cli-source-scan-ms', async () => {
    await Promise.all(sourcePaths.map(async (source) => {
      const filepath = resolve(scanner.cwd, source)
      await scanner.scan(source, await readFile(filepath, 'utf8'))
    }))
  })

  const css = await recorder.time('cli-css-extraction-ms', async () => (await stylesheets.compose({
    scanner,
    baseManifest: defaultManifest,
    projectDir: scanner.cwd
  })).css)

  await recorder.time('cli-file-write-ms', async () => {
    const output = resolve(workspace, 'dist/output.css')
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, css)
  })

  recorder.addTiming('total-diagnostic-ms', performance.now() - totalStartedAt)

  return collectDiagnosticOutput(workspace, fixtureId, recorder)
}

async function runMasterViteDiagnostic(workspace: string, fixtureId: BenchmarkFixtureId): Promise<DiagnosticRunResult> {
  const tool = staticBuildTools.find((candidate) => candidate.id === 'master-static-vite')
  if (!tool) throw new Error('Missing Master CSS static Vite tool.')

  await prepareStaticWorkspace(workspace, fixtureId, tool)

  const recorder = new DiagnosticRecorder()
  const baselineMs = await runViteBaselineDiagnostic(`${workspace}-baseline`, fixtureId)
  recorder.addTiming('vite-baseline-build-ms', baselineMs)
  recorder.setCount('css-entry-count', 1)

  const totalStartedAt = performance.now()
  const masterCSS = await loadMasterCSSVite()
  const plugins = instrumentMasterVitePlugins(masterCSS({ mode: 'static' }), recorder)

  const build = await loadViteBuild()
  await recorder.time('vite-total-build-ms', () => build({
    root: workspace,
    configFile: false,
    logLevel: 'silent',
    plugins,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: 'index.html'
      }
    }
  }))

  recorder.addTiming('total-diagnostic-ms', performance.now() - totalStartedAt)
  recorder.setCount('source-file-count', (recorder.counts['vite-html-scan-count'] || 0) + (recorder.counts['vite-module-scan-count'] || 0))

  return collectDiagnosticOutput(workspace, fixtureId, recorder)
}

async function runViteBaselineDiagnostic(workspace: string, fixtureId: BenchmarkFixtureId) {
  const fixture = getStaticFixtureSource(fixtureId)
  await resetDirectory(workspace)
  await writeWorkspaceFiles(workspace, {
    'package.json': JSON.stringify({
      private: true,
      type: 'module'
    }, null, 2) + '\n',
    'index.html': addViteEntryScript(fixture.masterHtml),
    'input.css': '.benchmark-root{box-sizing:border-box}\n',
    'src/main.js': 'import "../input.css"\n'
  })

  const startedAt = performance.now()
  const build = await loadViteBuild()
  await build({
    root: workspace,
    configFile: false,
    logLevel: 'silent',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: 'index.html'
      }
    }
  })

  return performance.now() - startedAt
}

function instrumentMasterVitePlugins(plugins: VitePlugin[], recorder: DiagnosticRecorder): VitePlugin[] {
  return plugins.map((plugin) => {
    const next = { ...plugin } as VitePlugin

    if (plugin.name === 'master-css:scanner') {
      wrapPluginHook(next, 'configResolved', 'vite-master-scanner-init-ms', recorder)
    }

    if (plugin.name === 'master-css:usage-graph') {
      wrapPluginHook(next, 'transform', 'vite-master-module-scan-ms', recorder, () => {
        recorder.addCount('vite-module-scan-count')
      })
      wrapTransformIndexHtml(next, recorder)
    }

    if (plugin.name === 'master-css:style-entry') {
      wrapPluginHook(next, 'load', 'vite-master-style-entry-ms', recorder)
      wrapPluginHook(next, 'transform', 'vite-master-style-entry-ms', recorder)
    }

    if (plugin.name === 'master-css:style-entry:build') {
      wrapPluginHook(next, 'generateBundle', 'vite-master-generate-bundle-ms', recorder)
    }

    return next
  })
}

function wrapPluginHook(plugin: VitePlugin, hookName: string, metricId: string, recorder: DiagnosticRecorder, before?: () => void) {
  const original = plugin[hookName]
  if (typeof original !== 'function') return

  Object.assign(plugin, {
    [hookName]: async function wrappedPluginHook(this: unknown, ...args: unknown[]) {
      before?.()
      return recorder.time(metricId, () => original.apply(this, args))
    }
  })
}

function wrapTransformIndexHtml(plugin: VitePlugin, recorder: DiagnosticRecorder) {
  const original = plugin.transformIndexHtml
  if (!original || typeof original === 'string') return

  if (typeof original === 'function') {
    plugin.transformIndexHtml = async function wrappedTransformIndexHtml(this: unknown, ...args: unknown[]) {
      recorder.addCount('vite-html-scan-count')
      return recorder.time('vite-master-html-scan-ms', () => original.apply(this, args))
    }
    return
  }

  if (!isHookObject(original) || typeof original.handler !== 'function') return
  plugin.transformIndexHtml = {
    ...original,
    async handler(this: unknown, ...args: unknown[]) {
      recorder.addCount('vite-html-scan-count')
      return recorder.time('vite-master-html-scan-ms', () => original.handler.apply(this, args))
    }
  }
}

function isHookObject(value: unknown): value is { handler: (...args: unknown[]) => unknown } & Record<string, unknown> {
  return !!value && typeof value === 'object'
}

async function collectDiagnosticOutput(workspace: string, fixtureId: BenchmarkFixtureId, recorder: DiagnosticRecorder): Promise<DiagnosticRunResult> {
  const cssFiles = await findCSSFiles(resolve(workspace, 'dist'))
  if (!cssFiles.length) throw new Error(`No diagnostic CSS files were generated for ${fixtureId}.`)

  const cssBuffer = await readFiles(cssFiles)
  const fixture = getStaticFixtureSource(fixtureId)
  for (const marker of fixture.expectedCSSMarkers) {
    if (!cssBuffer.includes(marker)) {
      throw new Error(`Diagnostic CSS for ${fixtureId} is missing marker "${marker}".`)
    }
  }

  const cssBytes = summarizeBytes(cssBuffer)
  return {
    measurements: {
      ...recorder.entries(),
      'generated-css-raw-bytes': cssBytes.rawBytes,
      'generated-css-gzip-bytes': cssBytes.gzipBytes,
      'generated-css-brotli-bytes': cssBytes.brotliBytes
    },
    artifacts: await Promise.all(cssFiles.map((file) => measureRelativeArtifact(file))),
    cssBytes
  }
}

function createDiagnosticSamples(variantId: string, round: number, result: DiagnosticRunResult): BenchmarkSample[] {
  return Object.entries(result.measurements).map(([metricId, value]) => ({
    metricId,
    variantId,
    round,
    value
  }))
}

async function loadViteBuild(): Promise<ViteBuild> {
  const vite = await dynamicImport<{ build: ViteBuild }>('vite')
  return vite.build
}

async function loadMasterCSSVite(): Promise<MasterCSSVite> {
  const mod = await dynamicImport<{ default: MasterCSSVite }>('@master/css-vite')
  return mod.default
}
