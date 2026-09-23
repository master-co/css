import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { configuredMarkupMarkdown } from '../reference/configured-example'
import { projectStyleExample } from '../components/demo/project-style-examples'

import { packageTreeMarkdown } from './package-trees'
import { authoringExampleMarkdown } from './authoring-examples'

export const projectStyleGuideSlugs = ['theme', 'variables-and-modes', 'global-styles', 'cascade-layers', 'monorepo', 'authoring-packages', 'compatibility', 'view-transitions'] as const

export async function projectStyleGuideContent(siteRoot: string, slug: string) {
  if (!projectStyleGuideSlugs.includes(slug as typeof projectStyleGuideSlugs[number])) throw new Error(`Unsupported project style guide: ${slug}`)
  const result = await extractReferenceMdx(path.join(siteRoot, `app/[locale]/guide/${slug}/content.mdx`), [], [], {
    overview: 'include',
    component(name, attributes) {
      if (name === 'DemoFeatureSupport') return `Browser feature check: \`${String(attributes.condition)}\`. The live preview reports support in the current browser; the example retains its native fallback.`
      if (name === 'DemoViewTransition') return attributes.example === 'articles' ? '[Interactive article transition preview](/examples/article-transitions). Open an article and return to its card; focus is restored and reduced motion uses an immediate update.' : '[Interactive view transition preview](/examples/view-transitions). Choose a view; reduced motion and unavailable APIs use an immediate update.'
      if (name === 'ViewTransitionDemo') return '[Interactive view transition preview](/guide/view-transitions). Select a view to play the transition; an immediate update is available when the API or motion is unavailable.'
      if (name === 'ArticleTransitionDemo') return '[Interactive article transition preview](/guide/view-transitions#article-list-to-detail). Open an article and return to the list.'
      if (name === 'ExplorerView') return '[Interactive package tree](/guide/monorepo). The adjacent prose and configuration examples define the project boundaries.'
      if (name === 'PackageTree') return packageTreeMarkdown(String(attributes.name))
      if (name === 'PackageAuthoringExample') return authoringExampleMarkdown(String(attributes.part ?? 'preview'))
      if (name === 'ProjectStyleExample') {
        const example = projectStyleExample(String(attributes.name))
        return `${configuredMarkupMarkdown(example.source, example.html)}\n\n${example.caption}`
      }
    }
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
