import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { ReferenceDemoSection } from './types'

const siteRoot = path.basename(process.cwd()) === 'site' ? process.cwd() : path.join(process.cwd(), 'site')
/** Authored specimens retained for the site design-system gallery, independent of retired articles. */
export async function referenceDemoSections(page: string): Promise<ReferenceDemoSection[]> {
  if (!/^[a-z][a-z0-9-]+$/.test(page)) throw new Error(`Invalid demo specimen: ${page}`)
  return JSON.parse(await readFile(path.join(siteRoot, 'components/demo/specimens', `${page}.json`), 'utf8'))
}
