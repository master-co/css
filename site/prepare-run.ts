import { pages as basePages } from './scripts/generate-page-categories'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import i18n from '@master/internal-site/common/i18n.config.js'
import { writeIfChanged } from './scripts/write-if-changed'
import { extractSearchNodesFromMarkdown, generateSearchPages } from '@master/internal-site/utils/search-pages'
import { generateReference } from './reference/build'
import { loadPages } from './scripts/generate-llms-txt'

const siteRoot = fileURLToPath(new URL('.', import.meta.url))
const searchPages = await generateSearchPages({ cwd: siteRoot, defaultLocale: i18n.defaultLocale, locales: i18n.locales, write: false })
await generateReference(siteRoot, searchPages, basePages)
for (const locale of i18n.locales) {
  const pages = searchPages[locale]
  // During editing, only existing local translations are searchable. Production
  // has already asserted completeness before preparation or route generation.
  const authored = await loadPages(path.join(siteRoot, 'content'), locale, { skipMissing: true })
  for (const document of authored.filter(document => document.section !== 'reference')) {
    const entry = pages.find((entry: { url: string }) => entry.url === document.url)
    if (!entry) continue
    entry.title = document.title
    entry.description = document.description ?? ''
    entry.nodes = extractSearchNodesFromMarkdown(document.body)
  }
  await writeIfChanged(new URL(`./public/search/${locale}.json`, import.meta.url), JSON.stringify(pages))
}
