import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import type { NextAdapter } from 'next'
import { createCompilerSync } from '@master/css-compiler/node'
import { createRuntimeStylesheetAsset } from '@master/css-compiler/stylesheet'
import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX } from '@master/css-schema/runtime-style'
import type { MasterCSSServerStylesheet } from '@master/css-server'

/** Sidecars follow the final CSS asset URLs, including export and CDN delivery. */
export async function publishRuntimeStylesheets(ctx: Parameters<NonNullable<NextAdapter['onBuildComplete']>>[0], publish = true) {
  const stylesheets = ctx.outputs.staticFiles.filter(asset => asset.filePath.endsWith('.css'))
  const result: MasterCSSServerStylesheet[] = []
  if (!stylesheets.length) return result
  using compiler = createCompilerSync()
  const urls = stylesheets.map(asset => asset.pathname)
  for (const asset of stylesheets) {
    const css = await readFile(asset.filePath, 'utf8')
    const data = createRuntimeStylesheetAsset(compiler, css, asset.pathname, urls)
    result.push({ href: asset.pathname, asset: data })
    const prefix = (ctx.config as { assetPrefix?: string }).assetPrefix
    if (prefix) result.push({ href: prefix.replace(/\/$/, '') + '/' + asset.pathname.replace(/^\//, ''), asset: data })
    if (!publish) continue
    const descriptor = JSON.stringify(data)
    const filePath = asset.filePath + MASTER_CSS_STYLESHEET_ASSET_SUFFIX
    await writeFile(filePath, descriptor)
    ctx.outputs.staticFiles.push({
      ...asset, filePath, id: asset.id + MASTER_CSS_STYLESHEET_ASSET_SUFFIX,
      pathname: asset.pathname + MASTER_CSS_STYLESHEET_ASSET_SUFFIX,
      immutableHash: createHash('sha256').update(descriptor).digest('hex')
    })
  }
  return result
}
