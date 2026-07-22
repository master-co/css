import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNativeBinding } from '@master/css-native'
import { stringifyMasterCSSManifestJSON } from '@master/css-schema/manifest-json'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const manifestOutputFile = resolve(packageRoot, 'src/default-manifest.json')
const nativeCSSOutputFile = resolve(packageRoot, 'src/default-native.css')
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
