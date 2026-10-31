import { createHash } from 'node:crypto'
import { foundationFamilies, namespaceTokens } from '../common/foundation-data/tokens'
import preset from '../utils/preset-manifest'
import { documentHeadings } from './headings'
import { tokenPages } from './sheet-editorial'
import { breakpointsSheet, breakpointsSheetMarkdown, familiesSheet, familiesSheetMarkdown, tokenSheet, tokenSheetMarkdown, ungroupedFamilies, type ReferenceSheet } from './sheets'
import type { ReferenceDocument } from './types'

function document(id: string, title: string, description: string, markdown: string, sheet: ReferenceSheet, facts: unknown): ReferenceDocument {
  return {
    id: `tokens/${id}`, kind: 'tokens', title, description, category: 'Tokens', url: `/reference/tokens/${id}`,
    source: id === 'families' ? 'packages/preset/src/utilities.css' : 'packages/preset/src/theme.css',
    sourceDigest: createHash('sha256').update(JSON.stringify(facts)).digest('hex'), language: 'en', aliases: [], terms: [], rows: [], examples: [],
    related: ['rules/modes', 'directives/theme'], markdown, headings: documentHeadings(markdown), extractionNotes: [], sheet,
  }
}

const exampleFacts = ({ id, title, classes, css, configuration }: ReferenceDocument['examples'][number]) => ({ id, title, classes, css, configuration })

/** Token pages, the family index and the named conditions, in reading order. */
export function buildTokenContracts(): ReferenceDocument[] {
  const familiesView = familiesSheet()
  const families = document('families', 'Token families', 'Every prefix that reads a token, the property it sets and where its values live.', familiesSheetMarkdown(familiesView), familiesView, foundationFamilies)
  // A shared property points at its shortest prefix (padding → p); a prefix always names its own row.
  families.identifierAnchors = Object.fromEntries([
    ...foundationFamilies.toReversed().flatMap(family => [family.property, ...family.properties, `(${family.properties[0]}:`].map(key => [key, `family-${family.prefix}`])),
    ...foundationFamilies.flatMap(family => [family.prefix, `${family.prefix}-`].map(key => [key, `family-${family.prefix}`])),
  ])
  families.aliases = Object.keys(families.identifierAnchors!)
  families.terms = ['padding', 'p', 'px', 'padding-inline', '按鈕內距', '行內起點內距', 'token prefix', 'property mapping']
  if (ungroupedFamilies(familiesView).length) families.terms.push(...ungroupedFamilies(familiesView).map(family => family.prefix))

  const documents = [families]
  for (const page of tokenPages) {
    const sheet = tokenSheet(page)
    const tokens = page.groups.flatMap(group => namespaceTokens(group.namespace))
    const doc = document(page.id, page.title, page.summary, tokenSheetMarkdown(sheet), sheet, tokens)
    const anchors: [string, string][] = []
    for (const group of sheet.groups) for (const value of group.values) {
      const id = group.palette ? group.id : value.id
      anchors.push([value.className, id], [value.variable, id], [value.variable.slice(2), id])
    }
    // Companions such as --text-md--line-height point at their treatment.
    for (const token of tokens.filter(token => token.key.includes('--'))) {
      const owner = sheet.groups.flatMap(group => group.values).find(value => value.key === token.key.split('--')[0])
      if (owner) anchors.push([`--${token.name}`, owner.id])
    }
    doc.identifierAnchors = Object.fromEntries(anchors)
    doc.aliases = Object.keys(doc.identifierAnchors!)
    doc.terms = [page.id, page.title.toLowerCase(), ...new Set(page.groups.map(group => group.namespace))]
    doc.examples = [sheet.usage, sheet.customize].map(exampleFacts)
    documents.push(doc)
  }

  const conditions = breakpointsSheet()
  const breakpoints = document('breakpoints', 'Breakpoints', 'Named media conditions you append to any class with @.', breakpointsSheetMarkdown(conditions), conditions, preset.customMedia)
  breakpoints.identifierAnchors = Object.fromEntries(conditions.groups.flatMap(group => group.rows.map(row => [`@${row.name}`, `condition-${row.name}`])))
  breakpoints.aliases = Object.keys(breakpoints.identifierAnchors!)
  breakpoints.terms = ['breakpoint', 'media query', 'custom media', '斷點']
  breakpoints.examples = [conditions.usage, conditions.customize].map(exampleFacts)
  documents.push(breakpoints)
  return documents
}
