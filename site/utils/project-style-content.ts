import { translateSite } from './translations'
import { transitionStudyMarkdown } from '../content/guide/view-transitions/illustration'
import { monorepoIllustrationMarkdown } from '../content/guide/monorepo/illustration'
import { cascadeIllustrationMarkdown } from '../content/guide/cascade-layers/illustration'
import { packageIllustrationMarkdown } from '../content/guide/authoring-packages/illustration'
import { globalIllustrationMarkdown } from '../content/guide/global-styles/illustration'
import { themeIllustrationMarkdown } from '../content/guide/theme/illustration'
import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { configuredMarkupMarkdown } from '@master/internal-site/css/configured-example.ts'
import { projectStyleExample } from '@master/internal-site/demo/project-style-examples.ts'

import { packageTreeMarkdown } from './package-trees'
import { authoringExampleMarkdown } from './authoring-examples'
import { reuseIllustrationMarkdown } from '../content/guide/reusing-styles/illustration'
import { compatibilityIllustrationMarkdown } from '../content/guide/compatibility/illustration'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import { demoCopy } from '@master/internal-site/utils/document-copy.js'
import { dialogCopy } from '@master/internal-site/demo/foundations/dialog-copy.js'
import { authoringExampleCopy } from './authoring-examples'

export const projectStyleGuideSlugs = ['theme', 'reusing-styles', 'global-styles', 'cascade-layers', 'monorepo', 'authoring-packages', 'compatibility', 'view-transitions'] as const

export async function projectStyleGuideContent(siteRoot: string, slug: string, locale = 'en') {
  if (!projectStyleGuideSlugs.includes(slug as typeof projectStyleGuideSlugs[number])) throw new Error(`Unsupported project style guide: ${slug}`)
  const file = await localizedContentFile(siteRoot, `content/guide/${slug}/content.mdx`, locale)
  const { frontmatter } = await readLocalizedDocument({ sourceFile: file, locale })
  const t = (text: string) => translateSite(locale, text)
  const result = await extractReferenceMdx(file, [], [], {
    overview: 'include',
    component(name, attributes) {
      if (name === 'TransitionIllustration') return transitionStudyMarkdown(attributes.name ? String(attributes.name) : undefined)
      if (name === 'MonorepoIllustration') return monorepoIllustrationMarkdown()
      if (name === 'CascadeIllustration') return cascadeIllustrationMarkdown()
      if (name === 'PackageIllustration') return packageIllustrationMarkdown()
      if (name === 'GlobalIllustration') return globalIllustrationMarkdown()
      if (name === 'ThemeIllustration') return themeIllustrationMarkdown()
      if (name === 'CompatibilityIllustration') return compatibilityIllustrationMarkdown()
      if (name === 'ReuseIllustration') return reuseIllustrationMarkdown()
      if (name === 'DemoFeatureSupport') return `${t('Browser feature check')}: \`${String(attributes.condition)}\`. ${t('The live preview reports support in the current browser; the example retains its native fallback.')}`
      if (name === 'DemoViewTransition') return attributes.example === 'articles' ? `[${t('Interactive article transition preview')}](/guide/view-transitions#article-list-to-detail). ${t('Open an article and return to its card; focus is restored and reduced motion uses an immediate update.')}` : `[${t('Interactive view transition preview')}](/guide/view-transitions). ${t('Choose a view; reduced motion and unavailable APIs use an immediate update.')}`
      if (name === 'PackageTree') return packageTreeMarkdown(String(attributes.name))
      if (name === 'PackageAuthoringExample') {
        const part = String(attributes.part ?? 'preview')
        return authoringExampleMarkdown(part, part === 'source' ? authoringExampleCopy : demoCopy(frontmatter, locale, 'PackageAuthoringExample', authoringExampleCopy))
      }
      if (name === 'DemoDialogEntrance') {
        const copy = demoCopy(frontmatter, locale, 'FoundationDialog', dialogCopy)
        return `**${copy.title}**\n\n${copy.caption}`
      }
      if (name === 'ProjectStyleExample') {
        const example = demoCopy(frontmatter, locale, `ProjectStyleExample:${attributes.name}`, projectStyleExample(String(attributes.name)))
        return `${configuredMarkupMarkdown(example.source, example.html)}\n\n${example.caption}`
      }
    }
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
