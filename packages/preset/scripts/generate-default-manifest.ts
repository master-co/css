import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MasterCSS } from '@master/css-engine'
import { loadNativeBinding } from '@master/css-native'
import { normalizeMasterCSSManifestForJSON, stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const manifestOutputFile = resolve(packageRoot, 'src/default-manifest.json')
const nativeCSSOutputFile = resolve(packageRoot, 'src/default-native.css')
const defaultEngineSettings = MasterCSS.create({ manifest: { version: 1 } }).settings
const { compileCSSManifestFile, resolveCSSImportGraph } = await import(new URL('../../compiler/src/index.ts', import.meta.url).href) as typeof import('@master/css-compiler')

interface CompiledDefaultPresetManifest {
  manifest: MasterCSSManifest
  json: string
}

function compileDefaultPresetManifest(file: string): CompiledDefaultPresetManifest {
  const source = resolveCSSImportGraph(file).source
  const binding = loadNativeBinding({ required: true })!.binding
  const directives = JSON.parse(binding.compileCssDirectivesJson(source, JSON.stringify({
    from: file,
    preserveNativeCSS: false
  }))) as {
    manifestInput: unknown
    styleDefinitions?: unknown[]
  }
  return JSON.parse(binding.compileDefaultPresetManifestJson(JSON.stringify({
    manifestInput: directives.manifestInput,
    styleDefinitions: directives.styleDefinitions || []
  }))) as CompiledDefaultPresetManifest
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function isDefaultSettingValue(value: unknown, defaultValue: unknown) {
  if (Array.isArray(value) && Array.isArray(defaultValue)) {
    return value.length === defaultValue.length
      && value.every((item, index) => item === defaultValue[index])
  }
  return value === defaultValue
}

function createDefaultManifestSettings(settings: MasterCSSManifest['settings']): MasterCSSManifest['settings'] {
  if (!settings) return
  const entries = Object.entries(settings).filter(([key, value]) =>
    !isDefaultSettingValue(value, defaultEngineSettings[key as keyof typeof defaultEngineSettings])
  )
  return entries.length ? Object.fromEntries(entries) as MasterCSSManifest['settings'] : undefined
}

export function createDefaultManifest(cssManifest: MasterCSSManifest): MasterCSSManifest {
  const settings = createDefaultManifestSettings(cssManifest.settings)
  return normalizeMasterCSSManifestForJSON({
    version: 1,
    ...(settings ? { settings } : {}),
    ...(cssManifest.variables ? { variables: clone(cssManifest.variables) } : {}),
    ...(cssManifest.animations ? { animations: clone(cssManifest.animations) } : {}),
    ...(cssManifest.variants ? { variants: clone(cssManifest.variants) } : {}),
    ...(cssManifest.conditions ? { conditions: clone(cssManifest.conditions) } : {}),
    ...(cssManifest.breakpointConditions ? { breakpointConditions: clone(cssManifest.breakpointConditions) } : {}),
    ...(cssManifest.containerConditions ? { containerConditions: clone(cssManifest.containerConditions) } : {}),
    ...(cssManifest.selectors ? { selectors: clone(cssManifest.selectors) } : {}),
    ...(cssManifest.utilities ? { utilities: clone(cssManifest.utilities) } : {})
  })
}

export function createDefaultManifestFromSourceFile(file = sourceFile) {
  return compileDefaultPresetManifest(file).manifest
}

export function createDefaultManifestJSONFromSourceFile(file = sourceFile) {
  return compileDefaultPresetManifest(file).json
}

export function createDefaultNativeCSSFromSourceFile(file = sourceFile) {
  return compileCSSManifestFile(file, {
    preserveNativeCSS: true
  }).directives.nativeCSS
}

export function createDefaultManifestJSON(manifest: MasterCSSManifest) {
  return stringifyMasterCSSManifestJSON(manifest)
}

export function writeDefaultManifest(file = manifestOutputFile) {
  writeFileSync(file, createDefaultManifestJSONFromSourceFile())
}

export function writeDefaultNativeCSS(file = nativeCSSOutputFile) {
  writeFileSync(file, createDefaultNativeCSSFromSourceFile())
}

export function writeDefaultPresetArtifacts() {
  writeDefaultManifest()
  writeDefaultNativeCSS()
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  writeDefaultPresetArtifacts()
}
