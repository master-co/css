import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'

/** Export actual asset labels and URLs without executing presentation components. */
export async function brandContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'app/[locale]/brand/content.mdx'), [], [], {
    component(name, attrs) {
      if (name !== 'DemoAsset') return
      for (const key of ['title', 'description', 'src', 'alt']) {
        if (typeof attrs[key] !== 'string') throw new Error(`DemoAsset requires a literal ${key}`)
      }
      if (attrs.format !== undefined && typeof attrs.format !== 'string') throw new Error('DemoAsset requires a literal format')
      return `**${attrs.title}**\n\n${attrs.description}\n\n![${attrs.alt}](${attrs.src})\n\n[Download ${attrs.title} (${attrs.format ?? 'SVG'})](${attrs.src})`
    }
  })
  if (result.notes.length) throw new Error(`Incomplete Brand export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
