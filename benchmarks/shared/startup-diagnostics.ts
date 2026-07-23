import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'
import {
  getStaticFixtureSource,
  staticFixtureIds
} from '../fixtures/static'
import { summarizeBytes } from './bytes'
import {
  findCSSFiles,
  measureRelativeArtifact,
  readFiles,
  resetDirectory,
  resolveBenchmarkPackageFile,
  runCommand,
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

export type StartupDiagnosticToolId = 'master-cli-startup-diagnostic' | 'master-vite-startup-diagnostic'

export interface StartupDiagnosticResult {
  samples: BenchmarkSample[]
  artifacts: BenchmarkArtifact[]
}

interface DiagnosticRunResult {
  measurements: Record<string, number>
  artifacts: BenchmarkArtifact[]
  cssBytes: ByteSummary
}

const probeMarker = '__MASTER_CSS_STARTUP_DIAGNOSTICS__'

export const startupDiagnosticMetricIds = [
  'total-diagnostic-ms',
  'generated-css-raw-bytes',
  'generated-css-gzip-bytes',
  'generated-css-brotli-bytes',
  'source-file-count',
  'css-entry-count',
  'cli-command-elapsed-ms',
  'cli-probe-command-elapsed-ms',
  'cli-node-first-userland-ms',
  'cli-entry-import-ms',
  'cli-run-program-ms',
  'cli-child-process-uptime-ms',
  'cli-bin-module-import-ms',
  'cli-commander-import-ms',
  'cli-commander-parse-ms',
  'cli-core-module-import-ms',
  'cli-generate-module-import-ms',
  'cli-scanner-import-ms',
  'cli-stylesheet-import-ms',
  'cli-project-entries-import-ms',
  'cli-fast-glob-import-ms',
  'cli-chokidar-import-ms',
  'cli-consola-import-ms',
  'cli-master-css-import-ms',
  'vite-master-command-elapsed-ms',
  'vite-baseline-command-elapsed-ms',
  'vite-master-command-overhead-ms',
  'vite-probe-command-elapsed-ms',
  'vite-node-first-userland-ms',
  'vite-import-ms',
  'master-vite-import-ms',
  'master-vite-index-module-import-ms',
  'master-vite-core-module-import-ms',
  'master-vite-options-module-import-ms',
  'master-vite-common-module-import-ms',
  'master-vite-mode-runtime-import-ms',
  'master-vite-mode-static-import-ms',
  'master-vite-mode-progressive-import-ms',
  'master-vite-mode-pre-render-import-ms',
  'master-vite-plugin-context-import-ms',
  'master-vite-plugin-manifest-loader-import-ms',
  'master-vite-plugin-manifest-virtual-import-ms',
  'master-vite-plugin-emitted-globals-virtual-import-ms',
  'master-vite-plugin-scanner-import-ms',
  'master-vite-plugin-usage-graph-import-ms',
  'master-vite-plugin-local-compose-import-ms',
  'master-vite-plugin-style-entry-import-ms',
  'master-vite-plugin-style-entry-hmr-import-ms',
  'master-vite-plugin-style-entry-build-import-ms',
  'master-vite-plugin-inject-runtime-import-ms',
  'master-vite-plugin-manifest-preload-import-ms',
  'master-vite-plugin-avoid-fouc-import-ms',
  'master-vite-plugin-pre-render-import-ms',
  'master-vite-util-extracted-css-import-ms',
  'master-vite-util-register-style-source-import-ms',
  'master-vite-util-scanner-context-import-ms',
  'vite-css-scanner-import-ms',
  'vite-css-stylesheet-import-ms',
  'vite-css-project-manifest-import-ms',
  'vite-css-project-entries-import-ms',
  'vite-css-integration-node-import-ms',
  'vite-css-server-import-ms',
  'vite-css-runtime-import-ms',
  'vite-magic-string-import-ms',
  'master-vite-plugin-factory-ms',
  'vite-build-with-master-ms',
  'vite-child-process-uptime-ms',
  'vite-master-scanner-init-ms',
  'vite-master-html-scan-ms',
  'vite-master-module-scan-ms',
  'vite-master-style-entry-ms',
  'vite-master-generate-bundle-ms'
] as const

class DiagnosticRecorder {
  readonly timings: Record<string, number> = {}
  readonly counts: Record<string, number> = {}

  addTiming(metricId: string, value: number | undefined) {
    if (value === undefined || !Number.isFinite(value)) return
    this.timings[metricId] = (this.timings[metricId] || 0) + value
  }

  setCount(metricId: string, value: number | undefined) {
    if (value === undefined || !Number.isFinite(value)) return
    this.counts[metricId] = value
  }

  addMeasurements(measurements: Record<string, number>) {
    for (const [metricId, value] of Object.entries(measurements)) {
      if (metricId.endsWith('-count')) {
        this.setCount(metricId, value)
      } else {
        this.addTiming(metricId, value)
      }
    }
  }

  entries() {
    return {
      ...this.timings,
      ...this.counts
    }
  }
}

export function createStartupDiagnosticVariants(fixtureIds: BenchmarkFixtureId[] = staticFixtureIds): BenchmarkVariant[] {
  return fixtureIds.flatMap((fixtureId) => [
    {
      id: createStartupDiagnosticVariantId(fixtureId, 'master-cli-startup-diagnostic'),
      fixtureId,
      adapterId: 'master-static',
      label: `${fixtureId} / Master CSS CLI startup diagnostic`,
      limits: ['Startup diagnostics split child-process, module import, parser, and CLI runProgram costs.']
    },
    {
      id: createStartupDiagnosticVariantId(fixtureId, 'master-vite-startup-diagnostic'),
      fixtureId,
      adapterId: 'master-static',
      label: `${fixtureId} / Master CSS Vite startup diagnostic`,
      limits: ['Startup diagnostics split Vite baseline, plugin import/factory, and instrumented plugin hook costs.']
    }
  ])
}

export function createStartupDiagnosticVariantId(fixtureId: BenchmarkFixtureId, toolId: StartupDiagnosticToolId) {
  return `${fixtureId}-${toolId}`
}

export async function runStartupDiagnostic(options: {
  workspace: string
  fixtureId: BenchmarkFixtureId
  toolId: StartupDiagnosticToolId
  variantId: string
  round: number
}): Promise<StartupDiagnosticResult> {
  const result = options.toolId === 'master-cli-startup-diagnostic'
    ? await runMasterCLIStartupDiagnostic(options.workspace, options.fixtureId)
    : await runMasterViteStartupDiagnostic(options.workspace, options.fixtureId)

  return {
    samples: createDiagnosticSamples(options.variantId, options.round, result),
    artifacts: result.artifacts
  }
}

async function runMasterCLIStartupDiagnostic(workspace: string, fixtureId: BenchmarkFixtureId): Promise<DiagnosticRunResult> {
  const tool = staticBuildTools.find((candidate) => candidate.id === 'master-static-cli')
  if (!tool) throw new Error('Missing Master CSS static CLI tool.')

  await prepareStaticWorkspace(workspace, fixtureId, tool)

  const recorder = new DiagnosticRecorder()
  const totalStartedAt = performance.now()
  recorder.setCount('css-entry-count', 1)
  recorder.setCount('source-file-count', 1)

  const command = await runCommand(process.execPath, [
    resolveBenchmarkPackageFile('@master/css-cli', 'dist/bin/index.js'),
    'generate',
    'index.html',
    '-o',
    'dist/output.css',
    '-v',
    '0'
  ], workspace)
  recorder.addTiming('cli-command-elapsed-ms', command.elapsedMs)

  const cliPackageFile = resolveBenchmarkPackageFile('@master/css-cli', 'package.json')
  await runImportProbeBatch(workspace, recorder, [
    ['cli-bin-module-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-cli', 'dist/bin/index.js'))],
    ['cli-commander-import-ms', 'commander', cliPackageFile],
    ['cli-core-module-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-cli', 'dist/core.js'))],
    ['cli-generate-module-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-cli', 'dist/generate.js'))],
    ['cli-scanner-import-ms', '@master/css-tooling/scanner/node', cliPackageFile],
    ['cli-stylesheet-import-ms', '@master/css-compiler/stylesheet', cliPackageFile],
    ['cli-project-entries-import-ms', '@master/css-compiler/project', cliPackageFile],
    ['cli-fast-glob-import-ms', 'fast-glob', cliPackageFile],
    ['cli-chokidar-import-ms', 'chokidar', cliPackageFile],
    ['cli-consola-import-ms', 'consola', cliPackageFile],
    ['cli-master-css-import-ms', '@master/css', cliPackageFile]
  ])

  const parseProbe = await runProbe(workspace, 'cli-commander-parse', renderCLICommanderParseProbe(cliPackageFile))
  recorder.addMeasurements(parseProbe.metrics)

  const cliProbe = await runProbe(workspace, 'cli-run-program', renderCLIRunProgramProbe(
    resolveBenchmarkPackageFile('@master/css-cli', 'dist/core.js')
  ))
  recorder.addTiming('cli-probe-command-elapsed-ms', cliProbe.elapsedMs)
  recorder.addMeasurements(cliProbe.metrics)
  recorder.addTiming('total-diagnostic-ms', performance.now() - totalStartedAt)

  return collectDiagnosticOutput(workspace, fixtureId, recorder)
}

async function runMasterViteStartupDiagnostic(workspace: string, fixtureId: BenchmarkFixtureId): Promise<DiagnosticRunResult> {
  const tool = staticBuildTools.find((candidate) => candidate.id === 'master-static-vite')
  if (!tool) throw new Error('Missing Master CSS static Vite tool.')

  await prepareStaticWorkspace(workspace, fixtureId, tool)

  const recorder = new DiagnosticRecorder()
  const totalStartedAt = performance.now()
  recorder.setCount('css-entry-count', 1)

  const masterCommand = await runCommand(process.execPath, resolveViteBuildArgs(), workspace)
  recorder.addTiming('vite-master-command-elapsed-ms', masterCommand.elapsedMs)

  const baselineCommandMs = await runViteBaselineCommand(`${workspace}-baseline-command`, fixtureId)
  recorder.addTiming('vite-baseline-command-elapsed-ms', baselineCommandMs)
  recorder.addTiming('vite-master-command-overhead-ms', masterCommand.elapsedMs - baselineCommandMs)

  await runViteImportProbes(workspace, recorder)

  const viteProbe = await runProbe(workspace, 'vite-startup', renderViteStartupProbe())
  recorder.addTiming('vite-probe-command-elapsed-ms', viteProbe.elapsedMs)
  recorder.addMeasurements(viteProbe.metrics)
  recorder.addTiming('total-diagnostic-ms', performance.now() - totalStartedAt)

  return collectDiagnosticOutput(workspace, fixtureId, recorder)
}

async function runViteBaselineCommand(workspace: string, fixtureId: BenchmarkFixtureId) {
  const fixture = getStaticFixtureSource(fixtureId)
  await resetDirectory(workspace)
  await writeWorkspaceFiles(workspace, {
    'package.json': JSON.stringify({
      private: true,
      type: 'module'
    }, null, 2) + '\n',
    'index.html': addViteEntryScript(fixture.masterHtml),
    'input.css': '.benchmark-root{box-sizing:border-box}\n',
    'src/main.js': 'import "../input.css"\n',
    'vite.config.mjs': [
      'import { defineConfig } from "vite"',
      '',
      'export default defineConfig({',
      '    build: {',
      "        outDir: 'dist',",
      '        emptyOutDir: true,',
      '        rollupOptions: {',
      "            input: 'index.html'",
      '        }',
      '    }',
      '})',
      ''
    ].join('\n')
  })

  const result = await runCommand(process.execPath, resolveViteBuildArgs(), workspace)
  return result.elapsedMs
}

async function runImportProbe(
  workspace: string,
  metricId: typeof startupDiagnosticMetricIds[number],
  specifier: string,
  recorder: DiagnosticRecorder,
  resolverBaseFile?: string
) {
  const probe = await runProbe(workspace, `import-${metricId}`, renderImportProbe(metricId, specifier, resolverBaseFile))
  recorder.addMeasurements(probe.metrics)
}

type ImportProbeRequest = [
  metricId: typeof startupDiagnosticMetricIds[number],
  specifier: string,
  resolverBaseFile?: string
]

async function runImportProbeBatch(
  workspace: string,
  recorder: DiagnosticRecorder,
  probes: ImportProbeRequest[],
  batchSize = 8
) {
  for (let index = 0; index < probes.length; index += batchSize) {
    await Promise.all(probes.slice(index, index + batchSize).map(([metricId, specifier, resolverBaseFile]) => (
      runImportProbe(workspace, metricId, specifier, recorder, resolverBaseFile)
    )))
  }
}

async function runViteImportProbes(workspace: string, recorder: DiagnosticRecorder) {
  const vitePackageFile = resolveBenchmarkPackageFile('@master/css-vite', 'package.json')
  await runImportProbeBatch(workspace, recorder, [
    ['master-vite-index-module-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/index.js'))],
    ['master-vite-core-module-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/core.js'))],
    ['master-vite-options-module-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/options.js'))],
    ['master-vite-common-module-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/common.js'))],
    ['master-vite-mode-runtime-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/modes/runtime.js'))],
    ['master-vite-mode-static-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/modes/static.js'))],
    ['master-vite-mode-progressive-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/modes/progressive.js'))],
    ['master-vite-mode-pre-render-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/modes/pre-render.js'))],
    ['master-vite-plugin-context-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/context.js'))],
    ['master-vite-plugin-manifest-loader-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/manifest-loader.js'))],
    ['master-vite-plugin-manifest-virtual-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/manifest-virtual-module.js'))],
    ['master-vite-plugin-emitted-globals-virtual-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/emitted-globals-virtual-module.js'))],
    ['master-vite-plugin-scanner-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/scanner.js'))],
    ['master-vite-plugin-usage-graph-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/usage-graph.js'))],
    ['master-vite-plugin-local-compose-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/local-compose.js'))],
    ['master-vite-plugin-style-entry-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/style-entry.js'))],
    ['master-vite-plugin-style-entry-hmr-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/style-entry-hmr.js'))],
    ['master-vite-plugin-style-entry-build-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/style-entry-build.js'))],
    ['master-vite-plugin-inject-runtime-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/inject-runtime.js'))],
    ['master-vite-plugin-manifest-preload-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/manifest-preload.js'))],
    ['master-vite-plugin-avoid-fouc-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/avoid-fouc.js'))],
    ['master-vite-plugin-pre-render-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/plugins/pre-render.js'))],
    ['master-vite-util-extracted-css-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/utils/extracted-css.js'))],
    ['master-vite-util-register-style-source-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/utils/register-style-source.js'))],
    ['master-vite-util-scanner-context-import-ms', fileSpecifier(resolveBenchmarkPackageFile('@master/css-vite', 'dist/utils/scanner-context.js'))],
    ['vite-css-scanner-import-ms', '@master/css-tooling/scanner/node', vitePackageFile],
    ['vite-css-stylesheet-import-ms', '@master/css-compiler/stylesheet', vitePackageFile],
    ['vite-css-project-manifest-import-ms', '@master/css-compiler/project', vitePackageFile],
    ['vite-css-integration-node-import-ms', '@master/css-internal/node', vitePackageFile],
    ['vite-css-server-import-ms', '@master/css-server', vitePackageFile],
    ['vite-css-runtime-import-ms', '@master/css-runtime', vitePackageFile],
    ['vite-magic-string-import-ms', 'magic-string', vitePackageFile]
  ])
}

async function runProbe(workspace: string, name: string, source: string) {
  const probeFile = resolve(workspace, '.startup-probes', `${name}.mjs`)
  await mkdir(dirname(probeFile), { recursive: true })
  await writeFile(probeFile, source)

  const result = await runCommand(process.execPath, [probeFile], workspace)
  return {
    elapsedMs: result.elapsedMs,
    metrics: parseProbeMetrics(result.stdout)
  }
}

function renderImportProbe(metricId: string, specifier: string, resolverBaseFile?: string) {
  const importLines = specifier.startsWith('file:')
    ? [`await import(${JSON.stringify(specifier)})`]
    : [
      'import { createRequire } from "node:module"',
      'import { pathToFileURL } from "node:url"',
      `const require = createRequire(${JSON.stringify(resolverBaseFile || import.meta.url)})`,
      `await import(pathToFileURL(require.resolve(${JSON.stringify(specifier)})).href)`
    ]
  return [
    'import { performance } from "node:perf_hooks"',
    ...importLines.filter((line) => line.startsWith('import ')),
    '',
    'const metrics = {}',
    'const startedAt = performance.now()',
    ...importLines.filter((line) => !line.startsWith('import ')),
    `metrics[${JSON.stringify(metricId)}] = performance.now() - startedAt`,
    `console.log(${JSON.stringify(probeMarker)} + JSON.stringify(metrics))`,
    ''
  ].join('\n')
}

function renderCLICommanderParseProbe(cliPackageFile: string) {
  return [
    'import { performance } from "node:perf_hooks"',
    'import { createRequire } from "node:module"',
    'import { pathToFileURL } from "node:url"',
    '',
    'const metrics = {}',
    `const require = createRequire(${JSON.stringify(cliPackageFile)})`,
    'const { Command } = await import(pathToFileURL(require.resolve("commander")).href)',
    'const startedAt = performance.now()',
    'const program = new Command()',
    'program',
    '    .name("@master/css")',
    '    .description("Master CSS CLI")',
    '    .version("0.0.0")',
    '    .argument("[source paths...]", "The glob pattern paths to scan sources")',
    '    .option("-w, --watch", "Watch file changes and generate CSS rules.")',
    '    .option("-o, --output <path>", "Specify your CSS file output path", "master.css")',
    '    .option("-v, --verbose <level>", "Verbose logging 0~N", "1")',
    '    .option("--no-export", "Print only CSS results.")',
    '    .action(() => {})',
    'await program.parseAsync(["generate", "index.html", "-o", "dist/output.css", "-v", "0"], { from: "user" })',
    'metrics["cli-commander-parse-ms"] = performance.now() - startedAt',
    `console.log(${JSON.stringify(probeMarker)} + JSON.stringify(metrics))`,
    ''
  ].join('\n')
}

function renderCLIRunProgramProbe(coreFile: string) {
  return [
    'import { performance } from "node:perf_hooks"',
    'import { pathToFileURL } from "node:url"',
    '',
    'const metrics = {}',
    'metrics["cli-node-first-userland-ms"] = performance.now()',
    'const importStartedAt = performance.now()',
    `const { default: runProgram } = await import(pathToFileURL(${JSON.stringify(coreFile)}).href)`,
    'metrics["cli-entry-import-ms"] = performance.now() - importStartedAt',
    'const runStartedAt = performance.now()',
    'await runProgram(["node", "@master/css", "generate", "index.html", "-o", "dist/output.css", "-v", "0"])',
    'metrics["cli-run-program-ms"] = performance.now() - runStartedAt',
    'metrics["cli-child-process-uptime-ms"] = performance.now()',
    `console.log(${JSON.stringify(probeMarker)} + JSON.stringify(metrics))`,
    ''
  ].join('\n')
}

function renderViteStartupProbe() {
  return [
    'import { performance } from "node:perf_hooks"',
    '',
    'const metrics = {}',
    'const counts = {}',
    'metrics["vite-node-first-userland-ms"] = performance.now()',
    'const viteImportStartedAt = performance.now()',
    'const vite = await import("vite")',
    'metrics["vite-import-ms"] = performance.now() - viteImportStartedAt',
    'const masterViteImportStartedAt = performance.now()',
    'const masterCSSModule = await import("@master/css-vite")',
    'metrics["master-vite-import-ms"] = performance.now() - masterViteImportStartedAt',
    'const pluginFactoryStartedAt = performance.now()',
    'const plugins = instrumentMasterVitePlugins(masterCSSModule.default({ mode: "static" }))',
    'metrics["master-vite-plugin-factory-ms"] = performance.now() - pluginFactoryStartedAt',
    'const buildStartedAt = performance.now()',
    'await vite.build({',
    '    root: process.cwd(),',
    '    configFile: false,',
    '    logLevel: "silent",',
    '    plugins,',
    '    build: {',
    '        outDir: "dist",',
    '        emptyOutDir: true,',
    '        rollupOptions: {',
    '            input: "index.html"',
    '        }',
    '    }',
    '})',
    'metrics["vite-build-with-master-ms"] = performance.now() - buildStartedAt',
    'metrics["source-file-count"] = (counts["vite-html-scan-count"] || 0) + (counts["vite-module-scan-count"] || 0)',
    'metrics["vite-child-process-uptime-ms"] = performance.now()',
    `console.log(${JSON.stringify(probeMarker)} + JSON.stringify(metrics))`,
    '',
    'function instrumentMasterVitePlugins(plugins) {',
    '    return plugins.map((plugin) => {',
    '        const next = { ...plugin }',
    '        if (plugin.name === "master-css:scanner") {',
    '            wrapPluginHook(next, "configResolved", "vite-master-scanner-init-ms")',
    '        }',
    '        if (plugin.name === "master-css:usage-graph") {',
    '            wrapPluginHook(next, "transform", "vite-master-module-scan-ms", () => addCount("vite-module-scan-count"))',
    '            wrapTransformIndexHtml(next)',
    '        }',
    '        if (plugin.name === "master-css:style-entry") {',
    '            wrapPluginHook(next, "load", "vite-master-style-entry-ms")',
    '            wrapPluginHook(next, "transform", "vite-master-style-entry-ms")',
    '        }',
    '        if (plugin.name === "master-css:style-entry:build") {',
    '            wrapPluginHook(next, "generateBundle", "vite-master-generate-bundle-ms")',
    '        }',
    '        return next',
    '    })',
    '}',
    '',
    'function wrapPluginHook(plugin, hookName, metricId, before) {',
    '    const original = plugin[hookName]',
    '    if (typeof original !== "function") return',
    '    plugin[hookName] = async function wrappedPluginHook(...args) {',
    '        before?.()',
    '        return time(metricId, () => original.apply(this, args))',
    '    }',
    '}',
    '',
    'function wrapTransformIndexHtml(plugin) {',
    '    const original = plugin.transformIndexHtml',
    '    if (!original || typeof original === "string") return',
    '    if (typeof original === "function") {',
    '        plugin.transformIndexHtml = async function wrappedTransformIndexHtml(...args) {',
    '            addCount("vite-html-scan-count")',
    '            return time("vite-master-html-scan-ms", () => original.apply(this, args))',
    '        }',
    '        return',
    '    }',
    '    if (!original || typeof original !== "object" || typeof original.handler !== "function") return',
    '    plugin.transformIndexHtml = {',
    '        ...original,',
    '        async handler(...args) {',
    '            addCount("vite-html-scan-count")',
    '            return time("vite-master-html-scan-ms", () => original.handler.apply(this, args))',
    '        }',
    '    }',
    '}',
    '',
    'async function time(metricId, callback) {',
    '    const startedAt = performance.now()',
    '    try {',
    '        return await callback()',
    '    } finally {',
    '        metrics[metricId] = (metrics[metricId] || 0) + performance.now() - startedAt',
    '    }',
    '}',
    '',
    'function addCount(metricId) {',
    '    counts[metricId] = (counts[metricId] || 0) + 1',
    '}',
    ''
  ].join('\n')
}

function parseProbeMetrics(stdout: string) {
  const line = stdout.split(/\r?\n/).find((candidate) => candidate.startsWith(probeMarker))
  if (!line) {
    throw new Error(`Startup diagnostic probe did not emit metrics.\nstdout:\n${stdout}`)
  }

  return JSON.parse(line.slice(probeMarker.length)) as Record<string, number>
}

function fileSpecifier(file: string) {
  return pathToFileURL(file).href
}

function resolveViteBuildArgs() {
  return [
    resolveBenchmarkPackageFile('vite', 'bin/vite.js'),
    'build',
    '--config',
    'vite.config.mjs',
    '--logLevel',
    'silent',
    '--clearScreen',
    'false'
  ]
}

async function collectDiagnosticOutput(workspace: string, fixtureId: BenchmarkFixtureId, recorder: DiagnosticRecorder): Promise<DiagnosticRunResult> {
  const cssFiles = await findCSSFiles(resolve(workspace, 'dist'))
  if (!cssFiles.length) throw new Error(`No startup diagnostic CSS files were generated for ${fixtureId}.`)

  const cssBuffer = await readFiles(cssFiles)
  const fixture = getStaticFixtureSource(fixtureId)
  for (const marker of fixture.expectedCSSMarkers) {
    if (!cssBuffer.includes(marker)) {
      throw new Error(`Startup diagnostic CSS for ${fixtureId} is missing marker "${marker}".`)
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
