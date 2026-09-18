import type { CSSOptions } from 'vite'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createSassSourceMarkers } from './sass-source-markers'

type InlinePostCSS = Exclude<CSSOptions['postcss'], string | undefined>
type HostPlugin = Exclude<Extract<NonNullable<InlinePostCSS['plugins']>[number], { postcssPlugin: string }>, (...args: never[]) => unknown>
type HostRoot = Extract<Parameters<NonNullable<HostPlugin['prepare']>>[0]['root'], { type: 'root' }>
type HostNode = HostRoot['nodes'][number]
type AdditionalData = NonNullable<NonNullable<CSSOptions['preprocessorOptions']>['scss']>['additionalData']
const PREFIX = '\0master-css:module-source:'

export interface ModuleSourceDiagnostic {
  source: string
  code: string
  map?: string
}

export function moduleSourceID(owner: string, file: string) {
  return `${PREFIX}${encodeURIComponent(owner)}:${encodeURIComponent(file)}.css`
}

export function moduleSourceOwner(id: string) {
  if (!id.startsWith(PREFIX)) return
  const [owner, file] = id.slice(PREFIX.length, -4).split(':')
  return { owner: decodeURIComponent(owner), file: decodeURIComponent(file) }
}

/** Project Vite's Modules AST changes onto its original per-file syntax trees. */
export function createModuleSourceProjection(file: string): { plugin: HostPlugin, sources: Map<string, string>, diagnostics: Map<string, ModuleSourceDiagnostic>, sourceFiles: Map<string, string>, copyDuplicate(id: string, source: string): void, additionalData(value: AdditionalData): AdditionalData } {
  const originals = new Map<string, HostRoot>()
  const sources = new Map<string, string>()
  const projectedInputs = new Map<string, string>()
  const inputDiagnostics = new Map<string, ModuleSourceDiagnostic>()
  const diagnostics = new Map<string, ModuleSourceDiagnostic>()
  const authoredInputs = new Map<string, string>()
  const preparation = createSassSourceMarkers((id, source) => authoredInputs.set(id, source))
  const { markers } = preparation
  const sourceFiles = new Map<string, string>()
  const sourceFile = (id: string) => sourceFiles.get(id) ?? id
  const key = (node: HostNode) => `${node.type}:${node.source?.start?.offset}:${node.source?.end?.offset}`
  const plugin: HostPlugin = {
    postcssPlugin: 'master-css:module-source-projection',
    prepare({ root }) {
      if (root.type === 'root') originals.set(file, root.clone())
      return {}
    },
    Once(root, { postcss }) {
      // postcss-import has run; its nodes still identify the original inputs.
      root.walk(node => {
        const input = node.source?.input
        if (input?.file && !originals.has(sourceFile(input.file))) originals.set(sourceFile(input.file), postcss.parse(input.css, { from: sourceFile(input.file) }))
      })
      root.walkComments(node => {
        const temporaryMap = node.source?.input.file && sourceFiles.has(node.source.input.file) && node.text.trim().startsWith('# sourceMappingURL=')
        if (temporaryMap || markers.has(node.text.trim())) node.remove()
      })
    },
    OnceExit(root) {
      const transformed = new Map<string, HostNode>()
      root.walk(node => {
        const input = node.source?.input
        if (input?.file) transformed.set(`${sourceFile(input.file)}:${key(node)}`, node)
      })
      for (const [id, original] of originals) {
        for (const node of [...original.nodes]) {
          // Preserve the authored import; Rust owns its graph and conditions.
          if (node.type === 'atrule' && node.name.toLowerCase() === 'import') continue
          const next = transformed.get(`${id}:${key(node)}`)
          if (next) node.replaceWith(next.clone())
          else node.remove()
        }
        if (id === file) {
          // Modules prepends linked composes content without source metadata.
          // Keep the existing host output; do not invent its original location.
          original.prepend(root.nodes.filter(node => !node.source?.input.file).map(node => node.clone()))
        }
        const css = original.toString()
        sources.set(id, css)
        const input = original.source?.input.css
        if (input !== undefined) {
          projectedInputs.set(input, css)
          const printed = original.toResult({ from: id, to: id, map: { inline: false, annotation: false, sourcesContent: true } })
          const map = printed.map?.toJSON()
          if (map) map.sources = map.sources.map((source, index) => {
            const url = new URL(source, pathToFileURL(id))
            const temporary = url.protocol === 'file:' ? sourceFiles.get(fileURLToPath(url)) : undefined
            if (!temporary) return source
            // Unmapped generated segments must not point at deleted scratch
            // files or claim to be authored Sass. The diagnostic adapter treats
            // internal source identities as explicitly preprocessed locations.
            if (map.sourcesContent) map.sourcesContent[index] = ''
            return `\0master-css:preprocessed:${temporary}`
          })
          const diagnostic = { source: authoredInputs.get(id) ?? input, code: css, map: map && JSON.stringify(map) }
          diagnostics.set(id, diagnostic)
          inputDiagnostics.set(input, diagnostic)
        }
      }
      // Vite prints this root and chains its map with the Sass preprocessor map.
      const originalRoot = originals.get(file)
      if (originalRoot) { root.removeAll(); root.append(originalRoot.nodes.map(node => node.clone())) }
    }
  }
  return { plugin, sources, diagnostics, sourceFiles, additionalData: preparation.additionalData, copyDuplicate(id, source) {
    // postcss-import can omit another file with byte-identical input. Reuse
    // that input's host transformation, retaining the duplicate's own base.
    const projected = projectedInputs.get(source)
    if (projected !== undefined && !sources.has(id)) {
      sources.set(id, projected)
      const original = inputDiagnostics.get(source)
      const raw = original?.map ? JSON.parse(original.map) as { sources: string[], sourceRoot?: string } : undefined
      // A copied single-input map belongs to this identical input's real file.
      if (raw?.sources.length === 1) { raw.sources = [pathToFileURL(id).href]; raw.sourceRoot = '' }
      diagnostics.set(id, { source, code: projected, map: raw?.sources.length === 1 ? JSON.stringify(raw) : undefined })
    }
  } }
}
