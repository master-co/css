import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { configuredMarkupMarkdown } from '../reference/configured-example'
import { releaseFigureMarkdown } from '../content/blog/v2/illustrations'
import { componentMarkup, componentSource, themeMarkup, themeSource } from '../content/blog/v2/examples'
import { journalAssets, journalCaption, journalDescription, journalMarkup, journalSetup, journalSource, journalTitle } from '../content/blog/v2/journal'

export async function releaseContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'content/blog/v2/content.mdx'), [], [], {
    overview: 'include',
    component(name, attributes) {
      if (name === 'ReleaseJournal') return `**${journalTitle}**\n\n${journalDescription}\n\n${journalSetup}\n\nDownload: ${journalAssets.map(asset => `[${asset.label}](${asset.href})`).join(' · ')}\n\n${configuredMarkupMarkdown(journalSource, journalMarkup)}\n\n${journalCaption}`
      if (name === 'ReleaseIllustration') return releaseFigureMarkdown(String(attributes.name))
      if (name === 'ReleaseExample') {
        if (attributes.name === 'theme') return configuredMarkupMarkdown(themeSource, themeMarkup)
        if (attributes.name === 'component') return configuredMarkupMarkdown(componentSource, componentMarkup)
        throw new Error(`Unknown release example: ${attributes.name}`)
      }
    }
  })
  if (result.notes.length) throw new Error(`Incomplete release export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
