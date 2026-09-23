import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { extractReferenceMdx } from '../../../reference/markdown'
import type { ReferenceDemoSection } from './types'

const siteRoot = path.basename(process.cwd()) === 'site' ? process.cwd() : path.join(process.cwd(), 'site')
const root = path.join(siteRoot, 'app/[locale]/reference')
const cache = new Map<string, Promise<ReferenceDemoSection[]>>()

/** The adjacent authored examples are the source of the demonstrated classes. */
export function referenceDemoSections(page: string): Promise<ReferenceDemoSection[]> {
  if (!/^[a-z][a-z0-9-]+$/.test(page)) throw new Error(`Invalid reference demo page: ${page}`)
  // MDX is read from disk; Next does not track it as a dependency of this cache.
  if (process.env.NODE_ENV === 'development') return readSections(page)
  if (!cache.has(page)) cache.set(page, readSections(page))
  return cache.get(page)!
}

async function readSections(page: string) {
  const file = path.join(root, page, 'content.mdx')
  const source = await readFile(file, 'utf8')
  const { markdown, notes } = await extractReferenceMdx(file)
  if (notes.length) throw new Error(`${page}: ${notes.join('; ')}`)
  const sections: ReferenceDemoSection[] = []
  // Includes are expanded by the existing reference exporter, preserving their examples.
  const chunks = markdown.split(/(?=^#{2,3} )/m)
  for (const chunk of chunks) {
    const heading = chunk.match(/^#{2,3} (.+?) \{#([\w-]+)\}/)
    if (!heading) continue
    const [, title, id] = heading
    const html = [...chunk.matchAll(/```html[^\n]*\n([\s\S]*?)```/g)].map(match => match[1].trim())
    const css = [...chunk.matchAll(/```css[^\n]*\n([\s\S]*?)```/g)]
      .map(match => match[1]).filter(value => /@(?:theme|keyframes|font-face|components|utilities|settings)\b/.test(value)).join('\n')
    const classLists = [...html.join('\n').matchAll(/\bclass=("|')([\s\S]*?)\1/g)].map(match => match[2].split(/\s+/).filter(value => value !== '…' && value !== '...').join(' '))
    const authored = source.split(/(?=^#{2,3} )/m).find(value => value.includes(`{#${id}\\}`)) ?? ''
    const highlighted = [...authored.matchAll(/<!--\s*@MARK\s+([\s\S]*?)-->/g)].flatMap(match => match[1].trim().split(/\s+/))
    const classes = [...new Set(classLists.flatMap(value => value.split(/\s+/)).filter(Boolean))]
    // Coverage is based on authored headings, not generated CSS detail headings.
    if (!source.includes(`{#${id}`)) continue
    sections.push({ page, id, title: title.replace(/`/g, ''), html, css, classes, classLists, highlighted })
  }
  return sections
}
