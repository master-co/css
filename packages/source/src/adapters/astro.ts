import { extractClassCandidates } from '../extract-class-candidates'
import { extractOxcClasses } from './oxc'
import type { SourceAdapter, SourceAdapterInput } from './types'

const SCRIPT_BLOCK = /<script\b[^>]*>([\s\S]*?)<\/script>/gi
const STYLE_BLOCK = /<style\b[^>]*>[\s\S]*?<\/style>/gi

export const ASTRO_SOURCE_EXT = /\.astro(?:\?|$)/

function add(classes: Set<string>, classNames: string[]) {
  for (const className of classNames) {
    if (className) classes.add(className)
  }
}

function extractFrontmatter(content: string) {
  if (!content.startsWith('---')) return { frontmatter: '', markup: content }
  const closeMatch = /\r?\n---\r?\n/.exec(content.slice(3))
  if (!closeMatch) return { frontmatter: '', markup: content }
  const closeStart = 3 + closeMatch.index
  const closeEnd = closeStart + closeMatch[0].length
  return {
    frontmatter: content.slice(3, closeStart),
    markup: content.slice(closeEnd)
  }
}

export function extractAstroClasses(source: string, content: string): string[] {
  const classes = new Set<string>()
  const { frontmatter, markup } = extractFrontmatter(content)

  if (frontmatter) {
    add(classes, extractOxcClasses(`${source}.ts`, frontmatter))
  }

  let template = markup
  template = template.replace(SCRIPT_BLOCK, (_, scriptContent: string) => {
    add(classes, extractOxcClasses(`${source}.js`, scriptContent))
    return ''
  })
  template = template.replace(STYLE_BLOCK, '')
  add(classes, extractClassCandidates(template))

  return [...classes]
}

export function astroAdapter(): SourceAdapter {
  return {
    name: 'astro',
    test: ASTRO_SOURCE_EXT,
    async extract({ source, content }: SourceAdapterInput) {
      return extractAstroClasses(source, content)
    }
  }
}
