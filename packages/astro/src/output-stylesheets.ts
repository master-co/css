import { readFile, readdir } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describeLinkedStylesheet } from '@master/css-compiler/stylesheet'
import type { MasterCSSServerStylesheet } from '@master/css-server'

async function collectStylesheetFiles(dir: string, files: string[] = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name)
    if (entry.isDirectory()) await collectStylesheetFiles(file, files)
    else if (entry.isFile() && entry.name.endsWith('.css')) files.push(file)
  }
  return files
}

/** Describe every final stylesheet in Astro's client output for server rendering. */
export async function describeOutputStylesheets(dir: URL | string, base = '/'): Promise<MasterCSSServerStylesheet[]> {
  const root = typeof dir === 'string' ? dir : fileURLToPath(dir)
  const files = (await collectStylesheetFiles(root)).sort()
  if (!files.length) return []
  const prefix = base.replace(/\/?$/, '/')
  const hrefs = files.map(file => prefix + relative(root, file).split(sep).join('/'))
  const sources = await Promise.all(files.map(file => readFile(file, 'utf8')))
  return files.map((_, index) => describeLinkedStylesheet(sources[index], hrefs[index], hrefs))
}
