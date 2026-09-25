import type { Plugin } from 'vite'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { posix } from 'node:path'
import { createCompilerSync } from '@master/css-compiler/node'
import type { MasterCSSVitePluginContext } from '../core'
import type { ResolvedMasterCSSVitePluginOptions } from '../options'
import getExtractedCSS, { getExtractedCSSResult } from '../utils/extracted-css'
import { getScanner } from '../utils/scanner-context'
import { removeGraphOnlyStylesheetEntries } from '../utils/build-import-resolver'
import { prepareBuildStylesheet } from '../utils/build-stylesheet-delivery'
import { clearLocalStylesheets, localStylesheets } from '../utils/local-stylesheet'

function replaceSlotCSSRule(source: string, slotCSSRule: string, realCSS: string): { source: string, replaced: boolean } {
  let replaced = false
  const nextSource = source.split(slotCSSRule).map((part, index) => {
    if (index === 0) return part
    if (replaced) return part
    replaced = true
    return realCSS + part
  }).join('')
  return { source: nextSource, replaced }
}

export default function StyleEntryBuildPlugin(_options: ResolvedMasterCSSVitePluginOptions, context: MasterCSSVitePluginContext): Plugin {
  let renderedCSS: string | undefined
  let extracted: Awaited<ReturnType<typeof getExtractedCSSResult>> | undefined
  let compiler: ReturnType<typeof createCompilerSync> | undefined
  const prepared = new Map<string, ReturnType<typeof prepareBuildStylesheet>>()
  const prepare = (source: string) => {
    if (!compiler || !extracted) return
    if (!prepared.has(source)) prepared.set(source, prepareBuildStylesheet(compiler, source, getScanner(context).slotCSSRule, extracted, [...localStylesheets(context).values()]))
    return prepared.get(source)
  }
  return {
    name: 'master-css:style-entry:build',
    enforce: 'post',
    apply: 'build',
    async renderStart() {
      // Module transforms and usage collection finish before output rendering.
      if (this.getModuleInfo) removeGraphOnlyStylesheetEntries(context, id => this.getModuleInfo(id))
      if (context.stylesheets?.size === 0 && !context.virtualCSSImporters?.size) context.virtualCSSPlaceholderEmitted = false
      extracted = await getExtractedCSSResult(context)
      renderedCSS = extracted.css
      compiler?.dispose()
      compiler = extracted.stylesheets || localStylesheets(context).size ? createCompilerSync() : undefined
      prepared.clear()
    },
    outputOptions(options) {
      const assetFileNames = options.assetFileNames
      return {
        ...options,
        assetFileNames(asset) {
          const cssAsset = (asset.names ?? [asset.name]).some(name => name?.endsWith('.css'))
          const graph = cssAsset && typeof asset.source === 'string' ? prepare(asset.source) : undefined
          const result = graph ? { source: graph.source, replaced: true }
            : cssAsset && renderedCSS !== undefined && typeof asset.source === 'string' && !extracted?.stylesheets
              ? replaceSlotCSSRule(asset.source, getScanner(context).slotCSSRule, renderedCSS)
            : undefined
          const pattern = typeof assetFileNames === 'function'
            ? assetFileNames(result?.replaced ? { ...asset, source: result.source } : asset)
            : assetFileNames ?? '[name]-[hash][extname]'
          if (!result?.replaced) return pattern
          const bytes = createHash('sha256').update(result.source).digest()
          const hash = options.hashCharacters === 'hex' ? bytes.toString('hex')
            : options.hashCharacters === 'base36' ? BigInt(`0x${bytes.toString('hex')}`).toString(36)
              : bytes.toString('base64url')
          // Name the final bytes while Vite still owns all HTML/JS/CSS references.
          return pattern.replace(/\[hash(?::(\d+))?\]/g, (_token, length) => hash.slice(0, length ? Number(length) : 8))
        }
      }
    },
    async generateBundle(_options, bundle) {
      const slotCSSRule = getScanner(context).slotCSSRule
      const realCSS = renderedCSS ?? await getExtractedCSS(context)
      const cssFileNames = Object.keys(bundle).filter(eachFileName => eachFileName.endsWith('.css'))
      let replacedAny = false
      for (const eachCssFileName of cssFileNames) {
        const chunk = bundle[eachCssFileName]
        if (chunk.type === 'asset') {
          // @ts-expect-error rollup OutputAsset.source is string|Uint8Array
          const oldSource = String(bundle[eachCssFileName]['source'])
          const graph = prepare(oldSource)
          if (graph) {
            chunk.source = graph.source
            replacedAny = true
            for (const asset of graph.assets) {
              const fileName = posix.join(posix.dirname(eachCssFileName), asset.href)
              // These are already-final CSS graph assets referenced by @import
              // from the host stylesheet. Astro prunes CSS assets without a
              // page ownership record, so avoid classifying them as new host
              // stylesheets merely by their asset name.
              this.emitFile({ type: 'asset', fileName, name: 'master-css-generated', source: asset.css })
            }
            for (const resource of graph.resources ?? []) {
              const fileName = posix.join(posix.dirname(eachCssFileName), resource.href)
              this.emitFile({ type: 'asset', fileName, source: readFileSync(resource.file) })
            }
            continue
          }
          if (extracted?.stylesheets) continue
          const result = replaceSlotCSSRule(oldSource, slotCSSRule, realCSS)
          if (result.source !== oldSource) {
            // @ts-expect-error see above
            bundle[eachCssFileName]['source'] = result.source
          }
          if (result.replaced) {
            replacedAny = true
          }
        }
      }
      // The placeholder was emitted by a managed CSS import but no CSS
      // chunk in the final bundle still contained it. A downstream CSS
      // plugin or minifier likely rewrote or dropped the internal slot.
      if (context.virtualCSSPlaceholderEmitted && !replacedAny && realCSS.length > 0) {
        this.warn(
          `[master-css.vite] Could not splice managed style CSS into any bundle asset. ` +
          `The placeholder "${slotCSSRule}" was emitted but no CSS chunk in the final ` +
          `bundle still contained it — Vite's downstream CSS pipeline (a PostCSS ` +
          `plugin in your vite config, the bundler's CSS minifier, etc.) most likely ` +
          `rewrote or dropped it. The output will be missing Master CSS output.`
        )
      }
    },
    closeBundle() { compiler?.dispose(); compiler = undefined; prepared.clear(); clearLocalStylesheets(context) },
    renderError() { compiler?.dispose(); compiler = undefined; prepared.clear() }
  }
}
