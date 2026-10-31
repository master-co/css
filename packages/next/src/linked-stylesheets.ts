import { readFile } from 'node:fs/promises'
import type { NextAdapter } from 'next'
import { describeLinkedStylesheet } from '@master/css-compiler/stylesheet'
import type { MasterCSSServerStylesheet } from '@master/css-server'

/** The final CSS assets a rendered page may link, at their delivered URLs. */
export async function describeLinkedStylesheets(ctx: Parameters<NonNullable<NextAdapter['onBuildComplete']>>[0]) {
  const assets = ctx.outputs.staticFiles.filter(asset => asset.filePath.endsWith('.css'))
  const result: MasterCSSServerStylesheet[] = []
  const urls = assets.map(asset => asset.pathname)
  const prefix = (ctx.config as { assetPrefix?: string }).assetPrefix?.replace(/\/$/, '')
  for (const asset of assets) {
    const stylesheet = describeLinkedStylesheet(await readFile(asset.filePath, 'utf8'), asset.pathname, urls)
    result.push(stylesheet)
    if (prefix) result.push({ ...stylesheet, href: prefix + '/' + asset.pathname.replace(/^\//, '') })
  }
  return result
}
