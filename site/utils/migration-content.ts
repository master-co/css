import path from 'node:path'
import { migrationGuidesMarkdown } from '../utils/migration-guides'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'

export const migrationGuideSlugs = ['css', 'css-in-js', 'tailwindcss', 'v2-rc', 'v1', 'bootstrap', 'material-ui', 'sass', ''] as const

/** Keep comparison prose and complete code in both search and portable exports. */
export async function migrationGuideContent(siteRoot: string, slug: string) {
  if (!migrationGuideSlugs.includes(slug as typeof migrationGuideSlugs[number])) throw new Error(`Unsupported migration guide: ${slug}`)
  const result = await extractReferenceMdx(path.join(siteRoot, `app/[locale]/guide/migration/${slug ? `${slug}/` : ''}content.mdx`), [], [], { overview: 'include', component: name => name === 'MigrationGuides' || name === 'IconButtons' && !slug ? migrationGuidesMarkdown() : undefined })
  if (result.notes.length) throw new Error(`Incomplete migration/${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
