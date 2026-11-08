import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { introductionIllustrationMarkdown } from '../content/guide/introduction/illustration'
import { promoVideo } from './promo-video'

export async function introductionContent(siteRoot: string, locale = 'en') {
  const result = await extractReferenceMdx(await localizedContentFile(siteRoot, 'content/guide/introduction/content.mdx', locale), [], [], {
    overview: 'include',
    component(name) {
      if (name === 'IntroductionIllustration') return introductionIllustrationMarkdown()
      // The film is a link in Markdown: its title is the video's own, so every edition names it the same way.
      if (name === 'PromoVideo') return `[${promoVideo.title}](${promoVideo.watchUrl})`
    }
  })
  if (result.notes.length) throw new Error(`Incomplete Introduction export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
