import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseFrontmatter } from '@astrojs/markdown-remark'
import type { TranslationResource } from '@master/internal-site/build/localization.ts'
import { referenceUiCopy } from './ui.ts'

const root = fileURLToPath(new URL('./content/', import.meta.url))
const section = /^## ([\w-]+) \\\{#copy-\1\\\}\s*$/gm
/** Canonical contract inputs must be validated even when a build reuses prepared catalogs. */
export const requiredReferenceContracts = [
  'guide/style-declarations/contract.mdx',
  'guide/state-selectors/contract.mdx',
  'guide/conditional-queries/contract.mdx',
  'guide/variable-modes/contract.mdx',
  'guide/cascade-layers/contract.mdx',
  'guide/class-extraction/contract.mdx',
  'guide/directives/contract.mdx',
] as const

/** Required Reference resources cannot disappear behind the ordinary article draft policy. */
export function assertRequiredReferenceDocument(frontmatter: Record<string, unknown>, file: string) {
  if (frontmatter.draft === true) throw new Error(`Required Reference document cannot be a draft: ${file}`)
}

export function createReferenceCopyLoader(contentRoot: string) {
  const cache = new Map<string, { stamp: string; values: Record<string, string> }>()
  return (id: string, locale = 'en'): Record<string, string> => {
    const sourceFile = path.join(contentRoot, id, 'content.mdx')
    const file = path.join(contentRoot, id, `content${locale === 'en' ? '' : `.${locale}`}.mdx`)
    const files = locale === 'en' ? [sourceFile] : [sourceFile, file]
    const stamp = files.map(filename => {
      const info = statSync(filename)
      return `${info.mtimeMs}:${info.ctimeMs}:${info.size}`
    }).join('|')
    const prior = cache.get(file)
    if (prior?.stamp === stamp) return prior.values
    const documents = files.map(filename => {
      const document = parseFrontmatter(readFileSync(filename, 'utf8'))
      assertRequiredReferenceDocument(document.frontmatter, filename)
      return document
    })
    const source = documents.at(-1)!.content
    const headings = [...source.matchAll(section)]
    const values: Record<string, string> = {}
    for (const [index, heading] of headings.entries()) {
      if (heading[1] in values) throw new Error(`Duplicate Reference prose ID ${heading[1]} in ${file}`)
      values[heading[1]] = source.slice(heading.index! + heading[0].length, headings[index + 1]?.index ?? source.length).trim().replace(/\\([{}])/g, '$1')
    }
    if (!headings.length) throw new Error(`Reference prose has no authored sections: ${file}`)
    cache.set(file, { stamp, values })
    return values
  }
}

/** Authored Reference prose is maintained in local MDX, independently of generated facts. */
export const referenceCopy = createReferenceCopyLoader(root)

export function referenceText(id: string, key: string, locale = 'en'): string {
  const value = referenceCopy(id, locale)[key]
  if (!value) throw new Error(`Missing Reference prose: ${id} / ${locale} / ${key}`)
  return value
}

/** Replace only the explicitly authored prose fields; identifiers and examples remain shared. */
export function referenceEditorial<T>(value: T, id: string, locale = 'en', prefix = ''): T {
  const copy = referenceCopy(id, locale)
  const source = referenceCopy(id)
  const walk = (node: unknown, keys: string[]): unknown => {
    const key = keys.join('-').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '')
    if (key in source) {
      if (!copy[key]) throw new Error(`Missing Reference prose: ${id} / ${locale} / ${key}`)
      return copy[key]
    }
    if (Array.isArray(node)) return node.map((entry, index) => walk(entry, [...keys, String(index)]))
    if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([name, entry]) => [name, walk(entry, [...keys, name])]))
    return node
  }
  return walk(value, prefix ? [prefix] : []) as T
}

export function referenceCopyResources(siteRoot: string, locales: readonly string[] = ['en', 'tw', 'ja', 'ko', 'cn']): TranslationResource[] {
  const contentRoot = path.join(siteRoot, 'reference/content')
  const resources: TranslationResource[] = []
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) walk(file)
      else if (entry.name === 'content.mdx') {
        const id = `reference/${path.relative(contentRoot, directory).split(path.sep).join('/')}/content.mdx`
        const source = readFileSync(file, 'utf8')
        assertRequiredReferenceDocument(parseFrontmatter(source).frontmatter, file)
        resources.push({
          id, source,
          translations: Object.fromEntries(locales.filter(locale => locale !== 'en').map(locale => {
            try {
              const translatedFile = path.join(directory, `content.${locale}.mdx`)
              const translation = readFileSync(translatedFile, 'utf8')
              assertRequiredReferenceDocument(parseFrontmatter(translation).frontmatter, translatedFile)
              return [locale, translation]
            }
            catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; return [locale, undefined] }
          })),
          checkAnchors: true,
        })
      }
    }
  }
  walk(contentRoot)
  // Ordinary article discovery skips source drafts. These contracts remain
  // required by the Reference catalog, including a direct Astro build that
  // reads an already prepared payload rather than calling the catalog builder.
  for (const relative of requiredReferenceContracts) {
    const sourceFile = path.join(siteRoot, 'content', relative)
    assertRequiredReferenceDocument(parseFrontmatter(readFileSync(sourceFile, 'utf8')).frontmatter, sourceFile)
    for (const locale of locales.filter(locale => locale !== 'en')) {
      const file = sourceFile.replace(/\.mdx$/, `.${locale}.mdx`)
      try { assertRequiredReferenceDocument(parseFrontmatter(readFileSync(file, 'utf8')).frontmatter, file) }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error }
    }
  }
  resources.push({ id: 'reference/ui', source: JSON.stringify(referenceUiCopy('en')), translations: Object.fromEntries(locales.filter(locale => locale !== 'en').map(locale => [locale, JSON.stringify(referenceUiCopy(locale))])) })
  return resources
}
