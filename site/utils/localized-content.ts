import path from 'node:path'
import { readLocalizedDocument } from '@master/internal-site/build/localization.ts'
import type { GuideCategory } from './guide-overview'

/** Source publication status always governs every language and export. */
export async function publishedLocalizedDocument(sourceFile: string, locale = 'en', metadata: Record<string, any> = {}) {
  if (metadata.draft || metadata.disabled) return undefined
  const source = await readLocalizedDocument({ sourceFile, locale: 'en', metadata })
  if (source.frontmatter.draft === true || source.frontmatter.disabled === true) return undefined
  const document = locale === 'en' ? source : await readLocalizedDocument({ sourceFile, locale, metadata })
  if (document.frontmatter.draft === true || document.frontmatter.disabled === true) return undefined
  return document
}

/** The same local MDX source supplies the page, search and portable exports. */
export async function localizedContentFile(siteRoot: string, relativeFile: string, locale = 'en') {
  return (await readLocalizedDocument({ sourceFile: path.join(siteRoot, relativeFile), locale })).file
}

export async function localizedGuideCategories(siteRoot: string, categories: GuideCategory[], locale = 'en', { skipMissing = false } = {}): Promise<GuideCategory[]> {
  return Promise.all(categories.map(async category => ({
    ...category,
    pages: (await Promise.all(category.pages.map(async (page): Promise<GuideCategory['pages'][number] | undefined> => {
      const sourcePath = (page as any).sourcePath as string | undefined
      if (!sourcePath) throw new Error(`Missing source path for ${page.pathname}`)
      try {
        const document = await publishedLocalizedDocument(path.resolve(siteRoot, '..', sourcePath), locale, page)
        if (!document) return undefined
        return { ...page, title: document.metadata.title, description: document.metadata.description }
      } catch (error) {
        if (skipMissing && (error as Error & { cause?: NodeJS.ErrnoException }).cause?.code === 'ENOENT') return undefined
        throw error
      }
    }))).filter((page): page is GuideCategory['pages'][number] => Boolean(page))
  })))
}
