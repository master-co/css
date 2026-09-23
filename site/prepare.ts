import { benchmarkContent } from './utils/benchmark-content'
import { introductionContent } from './utils/introduction-content'
import { brandContent } from './utils/brand-content'
import { installationGuideContent, installationGuideSlugs } from './utils/installation-content'
import 'internal/scripts/prepare-app'

import { readFile, rm, writeFile } from 'node:fs/promises'
import { extractSearchNodesFromMdx } from 'internal/utils/search-pages'
import { generateTranslatedContentRegistry } from './scripts/generate-translation-registry'
import { generateReference } from './reference/build'
import { guideOverviewMarkdown } from './utils/guide-overview'
import { syntaxTutorialContent } from './utils/syntax-tutorial'
import { foundationGuideContent, foundationGuideSlugs } from './utils/foundation-content'
import { projectStyleGuideContent, projectStyleGuideSlugs } from './utils/project-style-content'
import { migrationGuideContent, migrationGuideSlugs } from './utils/migration-content'
import { deliveryGuideContent, deliveryGuideSlugs } from './utils/delivery-content'
import { agentGuideContent, agentGuideSlugs } from './utils/agent-content'
import { toolingGuideContent, toolingGuideSlugs } from './utils/tooling-content'

await generateTranslatedContentRegistry()
await generateReference(process.cwd())

const guideCategories = JSON.parse(await readFile(new URL('./.categories/guide.json', import.meta.url), 'utf8'))
const guideOverviewNodes = extractSearchNodesFromMdx(guideOverviewMarkdown(guideCategories))
const syntaxTutorialNodes = extractSearchNodesFromMdx((await syntaxTutorialContent(process.cwd())).markdown)
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
  const pages = JSON.parse(await readFile(searchFile, 'utf8'))
  const overview = pages.find((page: { url: string }) => page.url === '/guide' || page.url === `/${locale}/guide`)
  if (overview) overview.nodes = guideOverviewNodes
  const tutorial = pages.find((page: { url: string }) => page.url.replace(/^\/(en|tw)(?=\/)/, '') === '/guide/syntax-tutorial')
  if (tutorial) tutorial.nodes = syntaxTutorialNodes
  for (const page of pages) {
    const nodes = guideContentNodes.get(page.url.replace(/^\/(en|tw)(?=\/)/, ''))
    if (nodes) page.nodes = nodes
  }
  await writeFile(searchFile, JSON.stringify(pages))
}

await rm(new URL('./public/monaco-editor', import.meta.url), { recursive: true, force: true })
