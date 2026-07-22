import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

export const MASTER_CSS_BINDING_ABI_VERSION = 1
export const MASTER_CSS_MANIFEST_VERSION = 1
export const MASTER_CSS_HYDRATION_MANIFEST_VERSION = 1
const nativePackageVersion = (JSON.parse(readFileSync(
  fileURLToPath(new URL('../package.json', import.meta.url)),
  'utf8'
)) as { version?: string }).version || '0.0.0'

export interface NativeBindingInfo {
  bindingAbiVersion: number
  packageVersion: string
  manifestVersion: number
  hydrationManifestVersion: number
  target: string
}

export interface NativeEngineSession {
  manifestJson(): string
  ensureClassRules(classNames: string[]): string
  deleteClassRules(classNames: string[]): string
  nativeDeclarationCandidates(classNames: string[]): string
  ensureClassRulesWithNativeSupport(classNames: string[], supported: boolean[]): string
  refresh(manifestJSON: string): string
  snapshot(): string
  inspect(className: string): string
  dispose(): void
}

export interface NativeScannerSession {
  scan(source: string, content: string): string
  nativeDeclarationCandidates(candidates: string[]): string
  collectCandidates(candidates: string[]): string[]
  scanCandidates(
    source: string,
    content: string,
    candidates: string[],
    excludedClasses: string[],
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
  dispose(): void
}

export interface NativeValidatorSession {
  nativeDeclarationCandidates(classNames: string[]): string
  generateClasses(classNames: string[], nativeSupport?: boolean[]): string
  dispose(): void
}

export interface NativeLintSession {
  nativeDeclarationCandidates(classNames: string[]): string
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

export interface NativeBinding {
  bindingInfoJson(): string
  extractAstroClasses(source: string, content: string): string[]
  extractClassCandidates(content: string): string[]
  extractHtmlClasses(source: string, content: string): string[]
  extractOxcClasses(source: string, content: string): string[]
  compileNativeCssJson(source: string, optionsJSON?: string): string
  compileCssDirectivesJson(source: string, optionsJSON?: string): string
  compileThemeCssJson(source: string, optionsJSON?: string): string
  compileManifestInputJson(inputJSON: string, optionsJSON?: string): string
  normalizeManifestJson(manifestJSON: string): string
  normalizeDefaultManifestJson(manifestJSON: string): string
  compileDefaultPresetManifestJson(requestJSON: string): string
  renderClassesJson(manifestJSON: string, classNames: string[], nativeSupport?: boolean[]): string
  resolveCssImportGraphJson(requestJSON: string): string
  inspectCssJson(source: string): string
  createInspectionReportJson(inputJSON: string): string
  analyzeLanguageJson(source: string, contextsJSON: string, semanticTokensJSON: string): string
  ScannerSession: new (manifestJSON: string) => NativeScannerSession
  RenderSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => NativeRenderSession
  ValidatorSession: new (manifestJSON: string) => NativeValidatorSession
  LintSession: new (manifestJSON: string) => NativeLintSession
  EngineSession: new (manifestJSON: string, emittedGlobalsJSON?: string) => NativeEngineSession
}

export type NativeLoadFailureCode = 'NATIVE_UNAVAILABLE' | 'NATIVE_LOAD_FAILED'

export class NativeBindingError extends Error {
  constructor(
    public readonly code: NativeLoadFailureCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'NativeBindingError'
  }
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
    return { platform, arch, packageName: `@master/css-native-darwin-${arch}` }
  }
  if (platform === 'win32' && (arch === 'arm64' || arch === 'x64')) {
    return { platform, arch, packageName: `@master/css-native-win32-${arch}-msvc` }
  }
  if (platform === 'linux' && (arch === 'arm64' || arch === 'x64') && libc) {
    const suffix = libc === 'glibc' ? 'gnu' : 'musl'
    return { platform, arch, libc, packageName: `@master/css-native-linux-${arch}-${suffix}` }
  }
}

export function nativeAddonsDisabled(execArgv: readonly string[] = process.execArgv): boolean {
  return execArgv.includes('--no-addons')
}

export function getNativeCLIExecutableName(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32' ? 'mcss.exe' : 'mcss'
}

export function resolveNativeCLIPath(options: { required?: boolean, executablePath?: string } = {}) {
  if (nativeAddonsDisabled()) {
    if (!options.required) return
    throw new NativeBindingError('NATIVE_UNAVAILABLE', 'Native executables are disabled by --no-addons.')
  }

  const require = createRequire(import.meta.url)
  const executableName = getNativeCLIExecutableName()
  const configuredPath = options.executablePath || process.env.MASTER_CSS_NATIVE_CLI_PATH
  const developmentPath = resolve(fileURLToPath(new URL(`../artifacts/${executableName}`, import.meta.url)))
  if (configuredPath) {
    if (!existsSync(configuredPath)) {
      throw new NativeBindingError(
        'NATIVE_LOAD_FAILED',
        `Cannot load the configured Master CSS native executable: ${configuredPath}`
      )
    }
    return configuredPath
  }
  if (existsSync(developmentPath)) return developmentPath

  const target = resolveNativeTarget()
  if (!target) {
    if (!options.required) return
    throw new NativeBindingError(
      'NATIVE_UNAVAILABLE',
      `Master CSS has no native executable for ${process.platform}-${process.arch}.`
    )
  }
  try {
    const executablePath = resolve(dirname(require.resolve(target.packageName)), executableName)
    if (!existsSync(executablePath)) {
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
  const mismatch = info.bindingAbiVersion !== MASTER_CSS_BINDING_ABI_VERSION
    || info.packageVersion !== nativePackageVersion
    || info.manifestVersion !== MASTER_CSS_MANIFEST_VERSION
    || info.hydrationManifestVersion !== MASTER_CSS_HYDRATION_MANIFEST_VERSION
  if (mismatch) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Master CSS native executable ABI mismatch: ${executablePath}`
    )
  }
  return info
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
  const mismatch = info.bindingAbiVersion !== MASTER_CSS_BINDING_ABI_VERSION
    || info.packageVersion !== nativePackageVersion
    || info.manifestVersion !== MASTER_CSS_MANIFEST_VERSION
    || info.hydrationManifestVersion !== MASTER_CSS_HYDRATION_MANIFEST_VERSION
  if (mismatch) {
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Master CSS native binding ABI mismatch: ${source}`
    )
  }
  return info
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

export function loadNativeBinding(options: LoadNativeBindingOptions = {}): LoadedNativeBinding | undefined {
  if (nativeAddonsDisabled()) {
    if (!options.required) return
    throw new NativeBindingError('NATIVE_UNAVAILABLE', 'Native addons are disabled by --no-addons.')
  }

  const require = createRequire(import.meta.url)
  const configuredPath = options.bindingPath || process.env.MASTER_CSS_NATIVE_BINDING_PATH
  const developmentPath = resolve(fileURLToPath(new URL('../artifacts/mastercss.node', import.meta.url)))
  const target = resolveNativeTarget()
  const source = configuredPath
    || (existsSync(developmentPath) ? developmentPath : target?.packageName)

  if (!source) {
    if (!options.required) return
    throw new NativeBindingError(
      'NATIVE_UNAVAILABLE',
      `Master CSS has no native binding for ${process.platform}-${process.arch}.`
    )
  }

  try {
    const binding = require(source) as NativeBinding
    return { binding, info: assertBindingInfo(binding, source), source }
  } catch (cause) {
    if (cause instanceof NativeBindingError) throw cause
    throw new NativeBindingError(
      'NATIVE_LOAD_FAILED',
      `Cannot load the expected Master CSS native binding: ${source}`,
      { cause }
    )
  }
}
