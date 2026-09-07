import 'internal/scripts/prepare-app'

import { readFile, rm, writeFile } from 'node:fs/promises'
import { extractSearchNodesFromMdx } from 'internal/utils/search-pages'
import { generateTranslatedContentRegistry } from './scripts/generate-translation-registry'
import { generateReference } from './reference/build'
import { guideOverviewMarkdown } from './utils/guide-overview'

await generateTranslatedContentRegistry()
await generateReference(process.cwd())

const guideCategories = JSON.parse(await readFile(new URL('./.categories/guide.json', import.meta.url), 'utf8'))
const guideOverviewNodes = extractSearchNodesFromMdx(guideOverviewMarkdown(guideCategories))
for (const locale of ['en', 'tw']) {
  const searchFile = new URL(`./public/search/${locale}.json`, import.meta.url)
  const pages = JSON.parse(await readFile(searchFile, 'utf8'))
  const overview = pages.find((page: { url: string }) => page.url === '/guide' || page.url === `/${locale}/guide`)
  if (overview) overview.nodes = guideOverviewNodes
  await writeFile(searchFile, JSON.stringify(pages))
}

await rm(new URL('./public/monaco-editor', import.meta.url), { recursive: true, force: true })
