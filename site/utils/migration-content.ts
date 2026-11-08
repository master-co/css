import { tailwindIllustrationMarkdown } from '../content/guide/migration/tailwindcss/illustration'
import { shadcnIllustrationMarkdown } from '../content/guide/migration/shadcn-ui/illustration'
import { sassIllustrationMarkdown } from '../content/guide/migration/sass/illustration'
import { materialUIIllustrationMarkdown } from '../content/guide/migration/material-ui/illustration'
import { bootstrapIllustrationMarkdown } from '../content/guide/migration/bootstrap/illustration'
import { cssInJSIllustrationMarkdown } from '../content/guide/migration/css-in-js/illustration'
import { cssMigrationIllustrationMarkdown } from '../content/guide/migration/css/illustration'
import { localizedContentFile } from './localized-content'
import { migrationGuidesMarkdown } from '../utils/migration-guides'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { migrationIllustrationMarkdown } from '../content/guide/migration/illustration'
import { translateSite } from './translations'

export const migrationGuideSlugs = ['css', 'css-in-js', 'tailwindcss', 'shadcn-ui', 'bootstrap', 'material-ui', 'sass', ''] as const

/** Keep comparison prose and complete code in both search and portable exports. */
export async function migrationGuideContent(siteRoot: string, slug: string, locale = 'en') {
  if (!migrationGuideSlugs.includes(slug as typeof migrationGuideSlugs[number])) throw new Error(`Unsupported migration guide: ${slug}`)
  const result = await extractReferenceMdx(await localizedContentFile(siteRoot, `content/guide/migration/${slug ? `${slug}/` : ''}content.mdx`, locale), [], [], {
    overview: 'include',
    component(name) {
      if (name === 'TailwindIllustration') return tailwindIllustrationMarkdown()
      if (name === 'ShadcnIllustration') return shadcnIllustrationMarkdown()
      if (name === 'SassIllustration') return sassIllustrationMarkdown()
      if (name === 'MaterialUIIllustration') return materialUIIllustrationMarkdown()
      if (name === 'BootstrapIllustration') return bootstrapIllustrationMarkdown()
      if (name === 'CSSInJSIllustration') return cssInJSIllustrationMarkdown()
      if (name === 'CSSMigrationIllustration') return cssMigrationIllustrationMarkdown()
      if (name === 'MigrationGuides') return migrationGuidesMarkdown(text => translateSite(locale, text))
      if (name === 'MigrationIllustration') return migrationIllustrationMarkdown()
    }
  })
  if (result.notes.length) throw new Error(`Incomplete migration/${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
