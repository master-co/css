import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCompilerSync } from '@master/css-compiler/node'
import { createRuntimeStylesheetAsset } from '@master/css-compiler/stylesheet'
import { MASTER_CSS_STYLESHEET_ASSET_SUFFIX } from '@master/css-schema/runtime-style'
import type { MasterCSSServerStylesheet } from '@master/css-server'

export interface AstroOutputStylesheet extends MasterCSSServerStylesheet {
  readonly file: string
}

async function collectStylesheetFiles(dir: string, files: string[] = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) await collectStylesheetFiles(file, files)
    else if (entry.isFile() && entry.name.endsWith('.css')) files.push(file)
  }
  return files
}

/** Describe every final stylesheet in Astro's client output for server and runtime rendering. */
export async function describeOutputStylesheets(dir: URL | string, base = '/'): Promise<AstroOutputStylesheet[]> {
  const root = typeof dir === 'string' ? dir : fileURLToPath(dir)
  const files = (await collectStylesheetFiles(root)).sort()
  if (!files.length) return []
  const prefix = base.replace(/\/?$/, '/')
  const hrefs = files.map(file => prefix + relative(root, file).split(sep).join('/'))
  const sources = await Promise.all(files.map(file => readFile(file, 'utf8')))
  using compiler = createCompilerSync()
  return files.map((file, index) => ({
    file,
    href: hrefs[index],
    asset: createRuntimeStylesheetAsset(compiler, sources[index], hrefs[index], hrefs)
  }))
}

/** Runtime and progressive delivery read each linked stylesheet's sidecar. */
export async function writeRuntimeStylesheetSidecars(stylesheets: readonly AstroOutputStylesheet[]) {
  await Promise.all(stylesheets.map(({ file, asset }) => writeFile(file + MASTER_CSS_STYLESHEET_ASSET_SUFFIX, JSON.stringify(asset))))
}

/** Write CSS imported by rendered native stylesheets beside the client output. */
export function publishNativeStylesheet(dir: URL | string, base: string, css: string) {
  const root = typeof dir === 'string' ? dir : fileURLToPath(dir)
  const fileName = `${createHash('sha256').update(css).digest('hex').slice(0, 16)}.css`
  const outputDir = join(root, '_master-css', 'native')
  mkdirSync(outputDir, { recursive: true })
  writeFileSync(join(outputDir, fileName), css)
  return `${base.replace(/\/?$/, '/')}_master-css/native/${fileName}`
}
