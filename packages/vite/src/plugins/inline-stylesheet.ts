import { withSassDiagnostics } from '../utils/sass-diagnostics'
import { readFileSync } from 'node:fs'
import { posix } from 'node:path'
import MagicString from 'magic-string'
import { createCompilerSync } from '@master/css-compiler/node'
import type { Plugin } from 'vite'
import type { MasterCSSVitePluginContext } from '../core'
import { getScanner } from '../utils/scanner-context'
import { INLINE_URL_BASE, inlineDelivery, inlineDigest, inlineStylesheets, disposeInlineStylesheets, isInlineStylesheet, rewriteInlineURLs, inlineURLReferences, inlineBuiltURL } from '../utils/inline-stylesheet'

// Vite normalizes relative SSR bases; carry the configured value through config resolution.
const configuredBaseKey = Symbol('master-css:configured-inline-base')

/** Export managed CSS as a string without registering an automatic stylesheet. */
export default function InlineStylesheetPlugin(context: MasterCSSVitePluginContext): Plugin {
  const pending = new Map<string, { fileName: string, source: string | Uint8Array }[]>()
  const used = new Set<string>()
  return {
    name: 'master-css:inline-stylesheet',
    enforce: 'post',
    apply: 'build',
    config: { order: 'post', handler(config) { Reflect.set(config, configuredBaseKey, config.base) } },
    shouldTransformCachedModule({ id }) { if (isInlineStylesheet(id) && /\.(?:css|scss|sass)(?:[?#].*)?$/i.test(id)) return true },
    transform(_code, id) {
      const entry = inlineStylesheets(context).get(id)
      if (!entry) return
      entry.reference = this.emitFile({ type: 'asset', name: 'master-css-inline-base.css', source: '/* Master CSS inline asset base. */' })
      if (this.environment.config.consumer === 'server') return { code: `export default ${JSON.stringify(entry.token)}`, map: null }
      return { code: `export default ${JSON.stringify(entry.token)}.replaceAll(${JSON.stringify(entry.token + '_URL')}, new URL('.', import.meta.ROLLUP_FILE_URL_${entry.reference}).href)`, map: null }
    },
    resolveFileUrl({ referenceId, relativePath, format }) {
      if (![...inlineStylesheets(context).values()].some(entry => entry.reference === referenceId)) return
      if (format === 'iife' || format === 'umd') {
        const base = '(typeof document === "undefined" ? (typeof location === "undefined" ? require("node:url").pathToFileURL(__filename).href : location.href) : document.currentScript?.src || document.baseURI)'
        return `new URL(${JSON.stringify(relativePath)}, ${base}).href`
      }
      if (format === 'cjs') return `new URL(${JSON.stringify(relativePath)}, require("node:url").pathToFileURL(__filename).href).href`
    },
    async renderStart() {
      pending.clear()
      used.clear()
      const scanner = getScanner(context)
      using compiler = createCompilerSync()
      for (const entry of inlineStylesheets(context).values()) {
        if (!entry.reference) continue
        const result = entry.local ? { ...entry.local, css: entry.local.code } : await withSassDiagnostics(context, () => entry.collection.compose({ scanner, baseManifest: scanner.css.manifest, projectDir: context.config?.root, pruneNativeCSS: context.pruneNativeCSS, includeGeneratedCSS: context.includeGeneratedCSS, delivery: inlineDelivery(context) }))
        const managed = { entry: 'inline-managed', stylesheets: [{ id: 'inline-managed', href: INLINE_URL_BASE + 'entry.css', css: result.css }, ...(result.stylesheets ?? [])] }
        const bundle = compiler.prepareStylesheetBundle({ source: scanner.slotCSSRule, from: entry.token, slotCSSRule: scanner.slotCSSRule, managed })
        const hash = inlineDigest(JSON.stringify(bundle))
        const urls = Object.fromEntries(bundle.graph.stylesheets.map((node, i) => [node.id, `${INLINE_URL_BASE}master-css-inline-${hash}-${i}.css`]))
        const assets = compiler.renderStylesheetBundle({ bundle, urls, inlineImports: true })
        const ownedURLs = new Set([...Object.values(urls), ...(result.resources ?? []).map(resource => resource.href)])
        const css = assets.find(asset => asset.id === bundle.graph.entry)!.css
        const byURL = new Map(assets.map(asset => [asset.href, asset]))
        const reachable = new Set<string>()
        const queue = [css]
        for (const source of queue) {
          for (const reference of inlineURLReferences(compiler, source)) {
            const url = reference.url.split(/[?#]/)[0]
            if (!ownedURLs.has(url) || reachable.has(url)) continue
            reachable.add(url)
            const asset = byURL.get(url)
            if (asset) queue.push(asset.css)
          }
        }
        entry.urlMarker = entry.token + '_BASE'
        while (css.includes(entry.urlMarker)) entry.urlMarker += '_'
        const directory = posix.dirname(this.getFileName(entry.reference))
        entry.css = css
        const files = new Map([...ownedURLs].map(url => [url, posix.join(directory, url.slice(INLINE_URL_BASE.length))]))
        entry.files = files
        const publication: { fileName: string, source: string | Uint8Array }[] = []
        const linked = assets.filter(asset => asset.id !== bundle.graph.entry && reachable.has(asset.href))
        const renderLinked = () => linked.map(asset => {
          const fileName = files.get(asset.href)!
          const source = rewriteInlineURLs(compiler, asset.css, url => {
            const bare = url.split(/[?#]/)[0], file = entry.files!.get(bare)!, suffix = url.slice(bare.length), target = file + suffix
            // Retained CSS executes in the browser. Preserve its relative base
            // even when Vite normalizes the server module's base to '/'.
            const configuredBase: unknown = Reflect.get(this.environment.getTopLevelConfig(), configuredBaseKey)
            const config = configuredBase === './' || configuredBase === '' ? { base: configuredBase, experimental: this.environment.config.experimental } : this.environment.config
            const result = inlineBuiltURL(config, this.environment.config.consumer === 'server', target, fileName, 'css')
            return 'url' in result ? result.url : posix.relative(directory, file) + suffix
          }, ownedURLs)
          return { fileName, source }
        })
        if (linked.length) {
          // Hash the URL-mapped graph with canonical provisional filenames,
          // then render all final references together.
          const urlHash = inlineDigest(JSON.stringify(renderLinked()))
          for (const asset of linked) {
            const fileName = files.get(asset.href)!
            files.set(asset.href, fileName.slice(0, -4) + `-${urlHash}.css`)
          }
          publication.push(...renderLinked())
        }
        for (const resource of result.resources ?? []) {
          if (reachable.has(resource.href)) publication.push({ fileName: posix.join(directory, resource.href.slice(INLINE_URL_BASE.length)), source: readFileSync(resource.file) })
        }
        pending.set(entry.token, publication)
      }
    },
    renderChunk(code, chunk) {
      const output = new MagicString(code)
      using compiler = createCompilerSync()
      for (const entry of inlineStylesheets(context).values()) {
        if (entry.css === undefined || !entry.files) continue
        const pattern = new RegExp(`(["'])${entry.token}\\1`, 'g')
        const matches = [...code.matchAll(pattern)]
        if (!matches.length) continue
        const runtime: { marker: string, expression: string }[] = []
        const css = rewriteInlineURLs(compiler, entry.css, url => {
          const bare = url.split(/[?#]/)[0], file = entry.files!.get(bare)!, suffix = url.slice(bare.length), target = file + suffix
          const result = inlineBuiltURL(this.environment.config, this.environment.config.consumer === 'server', target, chunk.fileName, 'js')
          if ('url' in result) return result.url
          if ('runtime' in result) {
            const marker = `${entry.urlMarker}_RUNTIME_${runtime.length}__`
            runtime.push({ marker, expression: result.runtime })
            return marker
          }
          return entry.urlMarker + posix.relative(posix.dirname(this.getFileName(entry.reference!)), file) + suffix
        }, new Set(entry.files.keys()))
        let expression = JSON.stringify(css)
        for (const item of runtime) expression += `.replaceAll(${JSON.stringify(item.marker)}, encodeURI(String(${item.expression})).replaceAll("%25", "%"))`
        for (const match of matches) {
          used.add(entry.token)
          output.overwrite(match.index, match.index + match[0].length, expression)
        }
        const urlPattern = new RegExp(`(["'])${entry.token}_URL\\1`, 'g')
        for (const match of code.matchAll(urlPattern)) output.overwrite(match.index, match.index + match[0].length, JSON.stringify(entry.urlMarker))
      }
      if (!output.hasChanged()) return
      return { code: output.toString(), map: output.generateMap({ hires: true }) }
    },
    generateBundle(_options, bundle) {
      if (!this.environment.config.build.emitAssets) return
      const entries = [...inlineStylesheets(context).values()]
      const anchors = new Set(entries.filter(entry => used.has(entry.token) && entry.reference).map(entry => this.getFileName(entry.reference!)))
      for (const entry of entries) {
        if (used.has(entry.token)) {
          for (const asset of pending.get(entry.token) ?? []) this.emitFile({ type: 'asset', ...asset })
        } else if (entry.reference) {
          const fileName = this.getFileName(entry.reference)
          if (!anchors.has(fileName)) delete bundle[fileName]
        }
      }
    },
    closeBundle() { pending.clear(); used.clear(); disposeInlineStylesheets(context) }
  }
}
