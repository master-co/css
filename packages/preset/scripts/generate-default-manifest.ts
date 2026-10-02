import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createCompilerBindingSessionSync,
  type MasterCSSCompilerBindingSession
} from '@master/css-binding/compiler/node'
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
  compiler: MasterCSSCompilerBindingSession
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
    const analysis = compiler.analyzeCSSDependencies(source)
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
  return ({
    entry,
    files,
    edges
  })
}

function compileDefaultPresetManifest(file: string): CompiledDefaultPresetManifest {
  using compiler = createCompilerBindingSessionSync()
  const graph = resolvePresetStylesheet(file, compiler)
  const result = compiler.compileCSSStylesheetGraph({
    graph: { ...graph, resourceOwners: Object.fromEntries(Object.keys(graph.files).map(id => [id, `@master/css-preset/${relative(packageRoot, id).replace(/\\/g, '/')}`])) },
    urls: Object.fromEntries(Object.keys(graph.files).map((id, index) => [id, `./preset-${index}.css`])),
    options: { classes: [] },
    inlineImports: true
  })
  const directives = result.directives
  const compiled = compiler.compileDefaultPresetManifest({
    manifestInput: directives.manifestInput,
    styleDefinitions: directives.styleDefinitions || []
  })
  return {
    ...compiled,
    nativeCSS: (result.stylesheets.find(sheet => sheet.id === result.entry)?.css || '').trimEnd() + '\n'
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
