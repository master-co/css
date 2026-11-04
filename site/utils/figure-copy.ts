export interface FigureCopy {
  title: string
  alt: string
  caption: string
  description?: readonly { title: string; text: string }[]
}

/** Captions are authored in the article; the shared English drawing stays intact. */
export function figureCopy<T extends FigureCopy>(frontmatter: Record<string, any>, locale: string, key: string, original: T): T {
  if (locale === 'en') return original
  const copy = frontmatter.figures?.[key]
  if (!copy || ['title', 'alt', 'caption'].some(field => typeof copy[field] !== 'string' || !copy[field].trim())) {
    throw new Error(`Missing localized figure copy: ${key} (${locale})`)
  }
  if (original.description && (!Array.isArray(copy.description) || copy.description.length !== original.description.length || copy.description.some((item: any) => !item.title?.trim() || !item.text?.trim()))) {
    throw new Error(`Incomplete localized figure explanation: ${key} (${locale})`)
  }
  return { ...original, title: copy.title, alt: copy.alt, caption: copy.caption, ...(original.description ? { description: copy.description } : {}) }
}

export function figureMarkdown(figure: FigureCopy) {
  const explanation = figure.description
    ? figure.description.map(item => `- **${item.title}.** ${item.text}`).join('\n')
    : figure.alt
  return `**${figure.title}**\n\n${explanation}\n\n${figure.caption}`
}
