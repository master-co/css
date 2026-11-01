import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { brandAssets, brandGold, brandKit, brandMinimums, brandTypefaces } from '../common/brand'

function table(headings: string[], rows: string[][]) {
  return [`| ${headings.join(' | ')} |`, `| ${headings.map(() => '---').join(' | ')} |`, ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n')
}

/** Text equivalents of the visual specimens, from the same facts the page renders. */
export function brandComponentMarkdown(name: string, attributes: Record<string, unknown> = {}) {
  if (name === 'BrandMarkFigure') return 'The mark keeps half its height clear on every side.'
  if (name === 'BrandSignature') return 'Horizontal logotype: x is the wordmark\'s x-height; the mark is 1.3x high. Keep one x clear around the complete signature.'
  if (name === 'BrandMinimums') return `Minimum sizes at actual CSS pixels: ${brandMinimums.map(entry => `${entry.title.toLowerCase()} ${entry.height}px high`).join(', ')}.`
  if (name === 'BrandGold') return table(['Gold', 'Value'], brandGold().map(color => [color.title, `\`${color.value}\``]))
  if (name === 'BrandTypefaces') return table(['Typeface', 'Use'], brandTypefaces.map(face => [face.family, face.role]))
  if (name === 'BrandDownloads') {
    const assets = attributes.kind === 'logotype' ? brandAssets.slice(0, 2) : brandAssets.slice(2)
    return assets.map(asset => `**${asset.title}**\n\n${asset.description}\n\n![${asset.alt}](${asset.src})\n\n[Download ${asset.title} (SVG)](${asset.src})`).join('\n\n')
  }
  if (name === 'BrandKit') return `[Download the brand kit (ZIP)](${brandKit.src}) · [Asset manifest](${brandKit.manifest})`
}

/** Export actual asset labels and URLs without executing presentation components. */
export async function brandContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'content/brand/content.mdx'), [], [], {
    component: (name, attributes) => brandComponentMarkdown(name, attributes)
  })
  if (result.notes.length) throw new Error(`Incomplete Brand export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
