import { existsSync } from 'node:fs'
import { findPackageJSON } from 'node:module'
import { dirname, parse, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import {
  MASTER_CSS_BINDING_ABI_VERSION,
  MASTER_CSS_HYDRATION_MANIFEST_VERSION,
  MASTER_CSS_MANIFEST_VERSION,
  type MasterCSSBindingInfo
} from './protocol'
import { assertMasterCSSBindingInfo } from './binding'
import { NativeBindingError } from './errors'
import { MASTER_CSS_PACKAGE_VERSION } from './version'

export { NativeBindingError, type NativeLoadFailureCode } from './errors'
export {
  MasterCSSBindingContractError,
  assertMasterCSSBindingInfo,
  type MasterCSSBindingRequirements
} from './binding'

export {
  MASTER_CSS_BINDING_ABI_VERSION,
  MASTER_CSS_HYDRATION_MANIFEST_VERSION,
  MASTER_CSS_MANIFEST_VERSION
}

export type NativeBindingInfo = MasterCSSBindingInfo
export type {
  MasterCSSBinding,
  MasterCSSBindingFeature,
  MasterCSSBindingInfo,
  MasterCSSBindingSurface,
  MasterCSSResolvedBinding
} from './protocol'

export interface NativeEngineSession {
  manifestJson(): string
  ensureClassRules(classNames: string[]): string
  deleteClassRules(classNames: string[]): string
  registerEmittedGlobals(emittedGlobalsJSON: string): string
  nativeDeclarationCandidates(classNames: string[]): string
  ensureClassRulesWithNativeSupport(classNames: string[], supported: boolean[]): string
  refresh(manifestJSON: string): string
  snapshot(): string
  inspect(className: string): string
  dispose(): void
}

export interface NativeScannerSession {
  scan(source: string, content: string): string
  extractCandidates(source: string, content: string): string[]
  nativeDeclarationCandidates(candidates: string[]): string
  collectCandidates(candidates: string[]): string[]
  filterCandidates(candidates: string[], blocklistJSON: string): string[]
  invalidGeneratedClasses(batchJSON: string, ruleSupport: boolean[][]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    blocklistJSON: string,
    nativeSupport: boolean[],
    invalidGeneratedClasses: string[]
  ): string
  ensureClasses(classNames: string[]): string
  registerNativeClasses(classNames: string[]): boolean
  reset(): void
  state(): string
  dispose(): void
}

export interface NativeRenderSession {
  nativeDeclarationCandidates(classNames: string[]): string
  ensureClasses(classNames: string[], nativeSupport?: boolean[]): void
  ensureStylesheetResources(nativeCSS: string): void
  emittedGlobals(): string
  snapshot(): string
  snapshotForClasses(classNames: string[]): string
  dispose(): void
}

export interface NativeValidatorSession {
  nativeDeclarationCandidates(classNames: string[]): string
  generateClasses(classNames: string[], nativeSupport?: boolean[]): string
  dispose(): void
}

export interface NativeLintSession {
  nativeDeclarationCandidates(classNames: string[]): string
  resolveValidation(batchJSON: string, ruleErrorsJSON: string): string
  canonicalClassNames(classNames: string[], nativeSupport: boolean[] | undefined, optionsJSON?: string): string
  canonicalClassGroups(classNames: string[], nativeSupport: boolean[] | undefined, optionsJSON?: string): string
  canonicalComposeDirective(classNames: string[], nativeSupport: boolean[] | undefined, optionsJSON?: string): string
  rawValueCandidates(
    classNames: string[],
    nativeSupport: boolean[] | undefined,
    invalidGeneratedClasses: string[]
  ): string
  analyze(classNames: string[], nativeSupport: boolean[] | undefined, invalidGeneratedClasses: string[]): string
  analyzeClassList(
    classList: string,
    classNames: string[],
    nativeSupport: boolean[] | undefined,
    invalidGeneratedClasses: string[]
  ): string
  analyzeClassListPolicy(requestJSON: string): string
  dispose(): void
}

export interface NativeLanguageSession {
  analyzeDocument(requestJSON: string): string
  formatDirectives(requestJSON: string): string
  nativeDeclarationCandidates(classNames: string[]): string
  classifyClassNames(classNames: string[], nativeSupport?: boolean[]): string
  inspectClassName(className: string, nativeSupport?: boolean[], mode?: string): string
  completionIndex(): string
  colorPresentation(colorToken: string): string
  colorTokens(candidatesJSON: string): string
  dispose(): void
}

export interface NativeLexerSession {
  analyze(requestJSON: string): string
  dispose(): void
}

export interface NativeSourceSession {
  extract(requestJSON: string): string
  dispose(): void
}

export interface NativeBinding {
  bindingInfoJson(): string
  extractAstroClasses(source: string, content: string): string[]
  extractClassCandidates(content: string): string[]
  extractHtmlClasses(source: string, content: string): string[]
  extractOxcClasses(source: string, content: string): string[]
  findCssManifestEntries(projectDir: string): string[]
  loadProjectManifestJson(projectDir: string, baseManifestJSON: string, entries?: string[]): string
  loadProjectManifestPreparedJson(projectDir: string, baseManifestJSON: string, graphsJSON: string): string
  compileNativeCssJson(source: string, optionsJSON?: string): string
  compileCssDirectivesJson(source: string, optionsJSON?: string): string
  compileThemeCssJson(source: string, optionsJSON?: string): string
  analyzeCssDependenciesJson(source: string): string
  analyzeStandaloneDirectivesJson(source: string): string
  mergeCssExtractionPoliciesJson(policiesJSON: string): string
  filterCssExtractionCandidates(candidates: string[], blocklistJSON: string): string[]
  compileManifestInputJson(inputJSON: string, optionsJSON?: string): string
  lowerCssDirectivesJson(requestJSON: string, optionsJSON?: string): string
  normalizeManifestJson(manifestJSON: string): string
  normalizeDefaultManifestJson(manifestJSON: string): string
  compileDefaultPresetManifestJson(requestJSON: string): string
  renderClassesJson(manifestJSON: string, classNames: string[], nativeSupport?: boolean[]): string
  resolveCssImportGraphJson(requestJSON: string): string
  inspectCssJson(source: string): string
  createInspectionReportJson(inputJSON: string): string
  LanguageSession: new (manifestJSON: string) => NativeLanguageSession
  LexerSession: new () => NativeLexerSession
  SourceSession: new () => NativeSourceSession
  ScannerSession: new (manifestJSON: string) => NativeScannerSession
  RenderSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => NativeRenderSession
  ValidatorSession: new (manifestJSON: string) => NativeValidatorSession
  LintSession: new (manifestJSON: string) => NativeLintSession
  EngineSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => NativeEngineSession
}

export type NativeLibc = 'glibc' | 'musl'

export interface NativeTarget {
  packageName: string
  platform: NodeJS.Platform
  arch: string
  libc?: NativeLibc
}

function detectLinuxLibc(): NativeLibc {
  const report = process.report?.getReport() as { header?: { glibcVersionRuntime?: string } } | undefined
  return report?.header?.glibcVersionRuntime ? 'glibc' : 'musl'
}

export function resolveNativeTarget(
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch,
  libc: NativeLibc | undefined = platform === 'linux' ? detectLinuxLibc() : undefined
): NativeTarget | undefined {
  if (platform === 'darwin' && (arch === 'arm64' || arch === 'x64')) {
    return { platform, arch, packageName: `@master/css-binding-darwin-${arch}` }
  }
  if (platform === 'win32' && (arch === 'arm64' || arch === 'x64')) {
    return { platform, arch, packageName: `@master/css-binding-win32-${arch}-msvc` }
  }
  if (platform === 'linux' && (arch === 'arm64' || arch === 'x64') && libc) {
    const suffix = libc === 'glibc' ? 'gnu' : 'musl'
    return { platform, arch, libc, packageName: `@master/css-binding-linux-${arch}-${suffix}` }
  }
}

export function nativeAddonsDisabled(execArgv: readonly string[] = process.execArgv): boolean {
  return execArgv.includes('--no-addons')
}

export function getNativeCLIExecutableName(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32' ? 'mcss.exe' : 'mcss'
}

function runtimeResolutionBases() {
  const bases = [import.meta.url]
  if (process.argv[1]) bases.push(pathToFileURL(resolve(process.argv[1])).href)
  bases.push(pathToFileURL(resolve(process.cwd(), 'package.json')).href)
  return [...new Set(bases)]
}

function resolveDevelopmentArtifact(name: string) {
  try {
    const packageArtifact = resolve(dirname(fileURLToPath(import.meta.url)), '../artifacts', name)
    if (existsSync(packageArtifact)) return packageArtifact
  } catch {
    // A server bundler may replace import.meta.url with a non-file module identifier.
  }

  const startDirectories = [process.cwd()]
  if (process.argv[1]) startDirectories.push(dirname(resolve(process.argv[1])))
  for (const startDirectory of new Set(startDirectories)) {
    let directory = startDirectory
    const root = parse(directory).root
    while (true) {
      for (const artifact of [
        resolve(directory, 'node_modules/@master/css-binding/artifacts', name),
        resolve(directory, 'packages/binding/artifacts', name)
      ]) {
        if (existsSync(/*turbopackIgnore: true*/ artifact)) return artifact
      }
      if (directory === root) break
      directory = dirname(directory)
    }
  }
}

function resolveTargetArtifact(packageName: string, name: string) {
  for (const base of runtimeResolutionBases()) {
    try {
      const packageJSON = findPackageJSON(packageName, base)
      if (!packageJSON) continue
      const artifact = resolve(dirname(packageJSON), name)
      if (existsSync(artifact)) return artifact
    } catch {
      // Try the next real runtime base when a bundler replaced import.meta.url.
    }
  }
}

function loadNativeAddon(source: string): NativeBinding {
  const nativeModule = { exports: {} } as NodeModule
  process.dlopen(nativeModule, source)
  return nativeModule.exports as NativeBinding
}

export function resolveNativeCLIPath(options: { required?: boolean, executablePath?: string } = {}) {
  if (nativeAddonsDisabled()) {
    if (!options.required) return
    throw new NativeBindingError('NATIVE_UNAVAILABLE', 'Native executables are disabled by --no-addons.')
  }

  const executableName = getNativeCLIExecutableName()
  const configuredPath = options.executablePath || process.env.MASTER_CSS_NATIVE_CLI_PATH
  const developmentPath = resolveDevelopmentArtifact(executableName)
  if (configuredPath) {
    if (!existsSync(configuredPath)) {
      throw new NativeBindingError(
        'NATIVE_LOAD_FAILED',
        `Cannot load the configured Master CSS native executable: ${configuredPath}`
      )
    }
    return configuredPath
  }
  if (developmentPath) return developmentPath

  const target = resolveNativeTarget()
  if (!target) {
    if (!options.required) return
    throw new NativeBindingError(
      'NATIVE_UNAVAILABLE',
      `Master CSS has no native executable for ${process.platform}-${process.arch}.`
    )
  }
  try {
    const executablePath = resolveTargetArtifact(target.packageName, executableName)
    if (!executablePath) {
      throw new Error(`Missing ${executableName}`)
    }
    return executablePath
  } catch (cause) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Cannot resolve the expected Master CSS native executable: ${target.packageName}`,
      { cause }
    )
  }
}

export function assertNativeCLIInfo(executablePath: string): NativeBindingInfo {
  const result = spawnSync(executablePath, ['--binding-info'], {
    encoding: 'utf8',
    windowsHide: true
  })
  if (result.error || result.status !== 0) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Cannot execute the expected Master CSS native executable: ${executablePath}`,
      { cause: result.error }
    )
  }
  let info: NativeBindingInfo
  try {
    info = JSON.parse(result.stdout) as NativeBindingInfo
  } catch (cause) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Master CSS native executable returned invalid metadata: ${executablePath}`,
      { cause }
    )
  }
  try {
    return assertMasterCSSBindingInfo(info, {
      surface: 'cli',
      features: ['cli', 'engine', 'project', 'scanner', 'source'],
      packageVersion: MASTER_CSS_PACKAGE_VERSION
    })
  } catch (cause) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Master CSS native executable ABI mismatch: ${executablePath}`,
      { cause }
    )
  }
}

function assertBindingInfo(binding: NativeBinding, source: string): NativeBindingInfo {
  let info: NativeBindingInfo
  try {
    info = JSON.parse(binding.bindingInfoJson()) as NativeBindingInfo
  } catch (cause) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Master CSS native binding returned invalid metadata: ${source}`,
      { cause }
    )
  }
  try {
    return assertMasterCSSBindingInfo(info, {
      surface: 'native',
      features: ['compiler', 'diagnostics', 'engine', 'language', 'lint', 'project', 'render', 'scanner', 'source', 'validator'],
      packageVersion: MASTER_CSS_PACKAGE_VERSION
    })
  } catch (cause) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Master CSS native binding ABI mismatch: ${source}`,
      { cause }
    )
  }
}

export interface LoadNativeBindingOptions {
  required?: boolean
  bindingPath?: string
}

export interface LoadedNativeBinding {
  binding: NativeBinding
  info: NativeBindingInfo
  source: string
}

const loadedNativeBindings = new Map<string, LoadedNativeBinding>()

export function loadNativeBinding(options: LoadNativeBindingOptions = {}): LoadedNativeBinding | undefined {
  if (nativeAddonsDisabled()) {
    if (!options.required) return
    throw new NativeBindingError('NATIVE_UNAVAILABLE', 'Native addons are disabled by --no-addons.')
  }

  const configuredPath = options.bindingPath || process.env.MASTER_CSS_NATIVE_BINDING_PATH
  const developmentPath = resolveDevelopmentArtifact('mastercss.node')
  const target = resolveNativeTarget()
  const targetPath = target && resolveTargetArtifact(target.packageName, 'mastercss.node')
  const source = configuredPath
    || developmentPath
    || targetPath

  if (!source) {
    if (target) {
      throw new NativeBindingError(
        'NATIVE_LOAD_FAILED',
        `Cannot resolve the expected Master CSS native binding: ${target.packageName}`
      )
    }
    if (!options.required) return
    throw new NativeBindingError(
      'NATIVE_UNAVAILABLE',
      `Master CSS has no native binding for ${process.platform}-${process.arch}.`
    )
  }

  const cached = loadedNativeBindings.get(source)
  if (cached) return cached

  try {
    const binding = loadNativeAddon(source)
    const loaded = Object.freeze({
      binding,
      info: assertBindingInfo(binding, source),
      source
    })
    loadedNativeBindings.set(source, loaded)
    return loaded
  } catch (cause) {
    if (cause instanceof NativeBindingError) throw cause
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Cannot load the expected Master CSS native binding: ${source}`,
      { cause }
    )
  }
}
