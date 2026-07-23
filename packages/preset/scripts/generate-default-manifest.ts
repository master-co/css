import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadNativeCompilerBackend } from '@master/css-backend/compiler'
import type { MasterCSSNativeCompilerBackend } from '@master/css-backend/compiler'
import { serializeMasterCSSManifest } from '@master/css-schema/manifest'
import type { MasterCSSManifest } from '@master/css-schema/manifest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const sourceFile = resolve(packageRoot, 'src/index.css')
const manifestOutputFile = resolve(packageRoot, 'src/default-manifest.json')
const nativeCSSOutputFile = resolve(packageRoot, 'src/default-native.css')

interface CompiledDefaultPresetManifest {
  manifest: MasterCSSManifest
  json: string
  nativeCSS: string
}

function resolvePresetStylesheet(
  entryFile: string,
  compiler: MasterCSSNativeCompilerBackend
) {
  const entry = resolve(entryFile)
  const files: Record<string, string> = {}
  const edges: { from: string, specifier: string, resolved: string }[] = []
  const visited = new Set<string>()

  const visit = (file: string) => {
    const absoluteFile = resolve(file)
    if (visited.has(absoluteFile)) return
    if (!existsSync(absoluteFile)) throw new Error(`Preset CSS file not found: ${absoluteFile}`)
    visited.add(absoluteFile)
    const source = readFileSync(absoluteFile, 'utf8')
    files[absoluteFile] = source
    const analysis = compiler.analyzeCSSDependencies(source) as {
      imports: readonly { source: string }[]
    }
    for (const statement of analysis.imports) {
      if (!statement.source.startsWith('./') && !statement.source.startsWith('../')) continue
      const importedFile = resolve(dirname(absoluteFile), statement.source)
      edges.push({
        from: absoluteFile,
        specifier: statement.source,
        resolved: importedFile
      })
      visit(importedFile)
    }
  }

  visit(entry)
  return compiler.resolveCSSImportGraph({
    entry,
    files,
    edges
  }) as { source: string }
}

function compileDefaultPresetManifest(file: string): CompiledDefaultPresetManifest {
  const compiler = loadNativeCompilerBackend({ required: true })!
  const source = resolvePresetStylesheet(file, compiler).source
  const directives = compiler.compileCSSDirectives(source, {
    from: file,
    preserveNativeCSS: true
  }) as {
    manifestInput: unknown
    styleDefinitions?: unknown[]
    nativeCSS: string
  }
  const compiled = compiler.compileDefaultPresetManifest({
    manifestInput: directives.manifestInput,
    styleDefinitions: directives.styleDefinitions || []
  }) as Omit<CompiledDefaultPresetManifest, 'nativeCSS'>
  return {
    ...compiled,
    nativeCSS: directives.nativeCSS
  }
}

export function createDefaultManifestFromSourceFile(file = sourceFile) {
  return compileDefaultPresetManifest(file).manifest
}

export function createDefaultManifestJSONFromSourceFile(file = sourceFile) {
  return compileDefaultPresetManifest(file).json
}

export function createDefaultNativeCSSFromSourceFile(file = sourceFile) {
  return compileDefaultPresetManifest(file).nativeCSS
}

export function createDefaultManifestJSON(manifest: MasterCSSManifest) {
  return serializeMasterCSSManifest(manifest)
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
