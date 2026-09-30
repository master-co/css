import { benchmarkContent } from './utils/benchmark-content'
import { introductionContent } from './utils/introduction-content'
import { brandContent } from './utils/brand-content'
import { installationGuideContent, installationGuideSlugs } from './utils/installation-content'
import { pages as basePages } from './scripts/generate-page-categories'

import { readFile, rm } from 'node:fs/promises'
import i18n from './docs-shell/common/i18n.config.js'
import { writeIfChanged } from './scripts/write-if-changed'
import { extractSearchNodesFromMdx, generateSearchPages } from '~/site/docs-shell/utils/search-pages'
import { generateTranslatedContentRegistry } from './scripts/generate-translation-registry'
import { syncRawSources } from './scripts/sync-raw-sources'
import { generateReference } from './reference/build'
import { guideOverviewMarkdown } from './utils/guide-overview'
import { syntaxTutorialContent } from './utils/syntax-tutorial'
import { foundationGuideContent, foundationGuideSlugs } from './utils/foundation-content'
import { projectStyleGuideContent, projectStyleGuideSlugs } from './utils/project-style-content'
import { migrationGuideContent, migrationGuideSlugs } from './utils/migration-content'
import { deliveryGuideContent, deliveryGuideSlugs } from './utils/delivery-content'
import { agentGuideContent, agentGuideSlugs } from './utils/agent-content'
import { toolingGuideContent, toolingGuideSlugs } from './utils/tooling-content'

await syncRawSources()
const searchPages = await generateSearchPages({ defaultLocale: i18n.defaultLocale, locales: i18n.locales, write: false })
await generateTranslatedContentRegistry()
await generateReference(process.cwd(), searchPages, basePages)

const guideCategories = JSON.parse(await readFile(new URL('./.categories/guide.json', import.meta.url), 'utf8'))
const guideOverviewNodes = extractSearchNodesFromMdx(guideOverviewMarkdown(guideCategories))
const syntaxTutorialNodes = extractSearchNodesFromMdx((await syntaxTutorialContent(process.cwd())).searchMarkdown)
const guideContentNodes = new Map<string, ReturnType<typeof extractSearchNodesFromMdx>>(await Promise.all(foundationGuideSlugs.map(async slug => [
  `/guide/${slug}`, extractSearchNodesFromMdx((await foundationGuideContent(process.cwd(), slug)).searchMarkdown)
] as const)))
for (const slug of projectStyleGuideSlugs) {
  guideContentNodes.set(`/guide/${slug}`, extractSearchNodesFromMdx((await projectStyleGuideContent(process.cwd(), slug)).searchMarkdown))
}
for (const slug of migrationGuideSlugs) {
  guideContentNodes.set(`/guide/migration${slug ? `/${slug}` : ''}`, extractSearchNodesFromMdx((await migrationGuideContent(process.cwd(), slug)).searchMarkdown))
}
for (const slug of deliveryGuideSlugs) {
  guideContentNodes.set(`/guide/${slug}`, extractSearchNodesFromMdx((await deliveryGuideContent(process.cwd(), slug)).searchMarkdown))
}
for (const slug of toolingGuideSlugs) {
  guideContentNodes.set(`/guide/${slug}`, extractSearchNodesFromMdx((await toolingGuideContent(process.cwd(), slug)).searchMarkdown))
}
for (const slug of agentGuideSlugs) {
  guideContentNodes.set(`/guide/${slug}`, extractSearchNodesFromMdx((await agentGuideContent(process.cwd(), slug)).searchMarkdown))
}
for (const slug of installationGuideSlugs) {
  guideContentNodes.set(`/guide/installation${slug ? `/${slug}` : ''}`, extractSearchNodesFromMdx((await installationGuideContent(process.cwd(), slug)).searchMarkdown))
}
guideContentNodes.set('/guide/benchmarks', extractSearchNodesFromMdx((await benchmarkContent(process.cwd())).searchMarkdown))
guideContentNodes.set('/guide/introduction', extractSearchNodesFromMdx((await introductionContent(process.cwd())).searchMarkdown))
guideContentNodes.set('/brand', extractSearchNodesFromMdx((await brandContent(process.cwd())).searchMarkdown))
for (const locale of ['en', 'tw']) {
  const searchFile = new URL(`./public/search/${locale}.json`, import.meta.url)
  const pages = searchPages[locale]
  const overview = pages.find((page: { url: string }) => page.url === '/guide' || page.url === `/${locale}/guide`)
  if (overview) overview.nodes = guideOverviewNodes
  const tutorial = pages.find((page: { url: string }) => page.url.replace(/^\/(en|tw)(?=\/)/, '') === '/guide/syntax-tutorial')
  if (tutorial) tutorial.nodes = syntaxTutorialNodes
  for (const page of pages) {
    const nodes = guideContentNodes.get(page.url.replace(/^\/(en|tw)(?=\/)/, ''))
    if (nodes) page.nodes = nodes
    if (page.url.replace(/^\/(en|tw)(?=\/)/, '') === '/guide/migration/v2-rc') {
      page.identifiers = [{ text: '@compose', id: 'compose' }, { text: '@settings', id: 'settings' }, { text: 'size', id: 'sizing-and-resolution' }]
    }
  }
  await writeIfChanged(searchFile, JSON.stringify(pages))
}

await rm(new URL('./public/monaco-editor', import.meta.url), { recursive: true, force: true })
