import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Page } from './generate-llms-txt'

/** These namespaces contain generated article Markdown; assets remain untouched. */
export async function writeArticleMarkdownExports(publicDir: string, pages: Page[], locale: string) {
  const root = path.resolve(publicDir, locale === 'en' ? '.' : locale)
  const expected = new Set<string>()
  for (const page of pages) {
    const filename = path.resolve(publicDir, `.${page.url}.md`)
    if (filename !== path.join(root, 'guide.md') && filename !== path.join(root, 'benchmarks.md')
      && !filename.startsWith(path.join(root, 'guide') + path.sep)) {
      throw new Error(`Article export outside its owned locale namespace: ${page.url}`)
    }
    expected.add(filename)
    await mkdir(path.dirname(filename), { recursive: true })
    await writeFile(filename, `# ${page.title}\n\n${page.description ? page.description + '\n\n' : ''}${page.body}\n`, 'utf8')
  }
  async function removeStale(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return []
      throw error
    })) {
      const filename = path.join(directory, entry.name)
      if (entry.isDirectory()) await removeStale(filename)
      else if (entry.isFile() && entry.name.endsWith('.md') && !expected.has(filename)) await rm(filename)
    }
  }
  await removeStale(path.join(root, 'guide'))
  for (const name of ['guide.md', 'benchmarks.md']) {
    const filename = path.join(root, name)
    if (!expected.has(filename)) await rm(filename, { force: true })
  }
}
