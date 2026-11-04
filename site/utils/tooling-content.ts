import { lintIllustrationMarkdown } from '../content/guide/code-linting/illustration'
import { languageIllustrationMarkdown } from '../content/guide/language-service/illustration'
import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { toolingExample, toolingExampleMarkdown, toolingOptionGroup, toolingOptionsMarkdown } from './tooling-guide-data'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import { demoCopy } from '@master/internal-site/utils/document-copy.js'

export const toolingGuideSlugs = ['code-linting', 'language-service'] as const

export async function toolingGuideContent(siteRoot: string, slug: string, locale = 'en') {
  if (!toolingGuideSlugs.includes(slug as typeof toolingGuideSlugs[number])) throw new Error(`Unsupported tooling guide: ${slug}`)
  const file = await localizedContentFile(siteRoot, `content/guide/${slug}/content.mdx`, locale)
  const { frontmatter } = await readLocalizedDocument({ sourceFile: file, locale })
  const result = await extractReferenceMdx(file, [], [], {
    overview: 'include',
    component: (name, attributes) => name === 'LintIllustration' ? lintIllustrationMarkdown()
      : name === 'LanguageIllustration' ? languageIllustrationMarkdown()
      : name === 'ToolingOptions' ? toolingOptionsMarkdown(String(attributes.name), demoCopy(frontmatter, locale, `ToolingOptions:${attributes.name}`, toolingOptionGroup(String(attributes.name))))
      : name === 'ToolingExample' ? toolingExampleMarkdown(String(attributes.name), demoCopy(frontmatter, locale, `ToolingExample:${attributes.name}`, toolingExample(String(attributes.name)))) : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
