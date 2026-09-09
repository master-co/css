import {
  toManifestPreloadLinkTag
} from '@master/css-internal/manifest-facade'
import type { Compilation, Compiler } from 'webpack'
import { posix } from 'node:path'
import type { MasterCSSWebpackContext, WebpackSubPlugin } from '../plugin'

const JS_FILE_PATTERN = /\.m?js(?:[?#].*)?$/

function escapeRegExp(source: string) {
  return source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeAttributeValue(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
}

function hasTagWithHref(html: string, tagName: string, href: string) {
  const quotedHref = escapeRegExp(href)
  return new RegExp(
    String.raw`<${tagName}\b(?=[^>]*\bhref\s*=\s*(?:"${quotedHref}"|'${quotedHref}'|${quotedHref}(?=[\s>])))[^>]*>`,
    'i'
  ).test(html)
}

function hasScriptWithSrc(html: string, src: string) {
  const quotedSrc = escapeRegExp(src)
  return new RegExp(
    String.raw`<script\b(?=[^>]*\bsrc\s*=\s*(?:"${quotedSrc}"|'${quotedSrc}'|${quotedSrc}(?=[\s>])))[^>]*>`,
    'i'
  ).test(html)
}

function injectBeforeHeadClose(html: string, tag: string) {
  const headCloseIndex = html.search(/<\/head\s*>/i)
  return headCloseIndex === -1
    ? `${tag}${html}`
    : `${html.slice(0, headCloseIndex)}${tag}${html.slice(headCloseIndex)}`
}

function injectBeforeBodyClose(html: string, tag: string) {
  const bodyCloseIndex = html.search(/<\/body\s*>/i)
  return bodyCloseIndex === -1
    ? `${html}${tag}`
    : `${html.slice(0, bodyCloseIndex)}${tag}${html.slice(bodyCloseIndex)}`
}

function toPublicHref(compilation: Compilation, fileName: string, htmlFileName: string) {
  const publicPath = compilation.outputOptions.publicPath
  const base = typeof publicPath === 'string' && publicPath !== 'auto' ? publicPath : ''
  const href = base ? `${base.replace(/\/?$/, '/')}${fileName.replace(/^\/+/, '')}` : fileName
  if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(href)) return href
  const directory = posix.dirname(htmlFileName)
  return directory === '.' ? href : posix.relative(directory, href)
}

function usesModuleScript(compilation: Compilation) {
  return Boolean(compilation.outputOptions.module)
}

function createScriptTag(href: string, moduleScript: boolean) {
  return moduleScript
    ? `<script type="module" src="${escapeAttributeValue(href)}"></script>`
    : `<script defer src="${escapeAttributeValue(href)}"></script>`
}

function createRuntimePreloadTag(href: string, moduleScript: boolean) {
  return moduleScript
    ? `<link rel="modulepreload" crossorigin href="${escapeAttributeValue(href)}">`
    : `<link rel="preload" as="script" href="${escapeAttributeValue(href)}">`
}

function createRuntimeWasmPreloadTag(href: string) {
  return `<link rel="preload" as="fetch" type="application/wasm" crossorigin href="${escapeAttributeValue(href)}">`
}

function getRuntimeFiles(compilation: Compilation, entryName: string) {
  const entrypoint = compilation.entrypoints.get(entryName)
  return entrypoint
    ? entrypoint.getFiles().filter((fileName) => JS_FILE_PATTERN.test(fileName))
    : []
}

function getRuntimeWasmFiles(assets: Compilation['assets']) {
  return Object.keys(assets).filter((fileName) =>
    fileName.endsWith('.wasm') && fileName.includes('mastercss_binding_wasm_engine')
  )
}

function transformHTML(
  html: string,
  context: MasterCSSWebpackContext,
  compilation: Compilation,
  assets: Compilation['assets'],
  htmlFileName: string
) {
  const moduleScript = usesModuleScript(compilation)
  let nextHTML = html

  if (context.shouldPreloadRuntime()) {
    for (const runtimeFile of getRuntimeFiles(compilation, context.runtimeEntryName)) {
      const href = toPublicHref(compilation, runtimeFile, htmlFileName)
      if (!hasTagWithHref(nextHTML, 'link', href)) {
        nextHTML = injectBeforeHeadClose(nextHTML, createRuntimePreloadTag(href, moduleScript))
      }
    }

    for (const [assetFileName] of context.getManifestJSONAssets()) {
      const href = toPublicHref(compilation, assetFileName, htmlFileName)
      if (!hasTagWithHref(nextHTML, 'link', href)) {
        nextHTML = injectBeforeHeadClose(nextHTML, toManifestPreloadLinkTag(href))
      }
    }

    for (const wasmFile of getRuntimeWasmFiles(assets)) {
      const href = toPublicHref(compilation, wasmFile, htmlFileName)
      if (!hasTagWithHref(nextHTML, 'link', href)) {
        nextHTML = injectBeforeHeadClose(nextHTML, createRuntimeWasmPreloadTag(href))
      }
    }
  }

  for (const runtimeFile of getRuntimeFiles(compilation, context.runtimeEntryName)) {
    const href = toPublicHref(compilation, runtimeFile, htmlFileName)
    if (!hasScriptWithSrc(nextHTML, href)) {
      nextHTML = injectBeforeBodyClose(nextHTML, createScriptTag(href, moduleScript))
    }
  }

  return nextHTML
}

export default function RuntimeHTMLAssetsPlugin(context: MasterCSSWebpackContext): WebpackSubPlugin {
  return {
    apply(compiler: Compiler) {
      compiler.hooks.thisCompilation.tap(context.name, (compilation: Compilation) => {
        if (!compilation.hooks.processAssets?.tap || !compiler.webpack?.Compilation || !compiler.webpack?.sources?.RawSource) return
        const stages = [
          compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
          compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
            ?? compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
            ?? compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE + 1000
        ]
        for (const stage of stages) {
          compilation.hooks.processAssets.tap({
            name: context.name,
            stage
          }, (assets) => {
            const RawSource = compiler.webpack.sources.RawSource
            for (const [fileName, asset] of Object.entries(assets)) {
              if (!fileName.endsWith('.html') && !fileName.endsWith('.htm')) continue
              const source = asset.source().toString()
              const nextSource = transformHTML(source, context, compilation, assets, fileName)
              if (nextSource === source) continue
              compilation.updateAsset(fileName, new RawSource(nextSource))
            }
          })
        }
      })
    }
  }
}
