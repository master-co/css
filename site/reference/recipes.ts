import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { documentHeadings } from './headings'
import { recipePages } from './sheet-editorial'
import { recipeSheet, recipeSheetMarkdown } from './sheets'
import type { ReferenceDocument } from './types'

/** Recipe pages read their definitions, parameter syntax and CSS from the preset. */
export async function buildRecipeContracts(siteRoot: string): Promise<ReferenceDocument[]> {
  const source = await readFile(path.join(siteRoot, '../packages/preset/src/utilities.css'), 'utf8')
  return recipePages.map(page => {
    const sheet = recipeSheet(page, source)
    const markdown = recipeSheetMarkdown(sheet)
    // Functions are found by their call form, so a bare `p` still leads to its token family.
    const calls = page.names.map(name => sheet.syntax.concat(sheet.more).some(row => row.syntax.startsWith(`${name}(`)) ? `${name}()` : name)
    return {
      id: page.id, kind: 'utility', title: page.title, description: page.summary, category: 'Utilities', url: `/reference/${page.id}`,
      source: 'packages/preset/src/utilities.css', sourceDigest: createHash('sha256').update(sheet.definitions).digest('hex'), language: 'en',
      aliases: calls, identifierAnchors: Object.fromEntries(calls.map(name => [name, 'overview'])), terms: [], rows: [],
      examples: [{ id: sheet.usage.id, title: sheet.usage.title, classes: sheet.usage.classes, css: sheet.usage.css }],
      related: ['directives/definitions'], guide: page.guide?.href, markdown, headings: documentHeadings(markdown), extractionNotes: [], sheet,
    } satisfies ReferenceDocument
  })
}
