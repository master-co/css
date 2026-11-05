import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { introductionIllustrationMarkdown } from '../content/guide/introduction/illustration'

export async function introductionContent(siteRoot: string, locale = 'en') {
  const result = await extractReferenceMdx(await localizedContentFile(siteRoot, 'content/guide/introduction/content.mdx', locale), [], [], {
    overview: 'include',
    component: name => name === 'IntroductionIllustration' ? introductionIllustrationMarkdown() : undefined
  })
  if (result.notes.length) throw new Error(`Incomplete Introduction export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
