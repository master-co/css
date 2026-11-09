import { languageOf } from '@master/internal-site/common/locales.js'
import { referenceLabel as label, referenceHeader } from './ui'
import { referenceText as text, referenceEditorial } from './copy'
import { createHash } from 'node:crypto'
import type { MasterCSSMediaQueryExpression } from '@master/css-schema/manifest'
import preset from '@master/internal-site/css/preset-manifest.ts'
import { documentHeadings } from './headings'
import { sheetExample, sheetExampleMarkdown, type NamedConditionsSheet } from './sheets'
import { referenceIllustrationMarkdown } from './illustrations'
import type { ReferenceDocument } from './types'

/** One editorial source for the structured lookup and its portable exports. */
const sourceNamedConditionText = {
  intro: text('rules/named-conditions', "intro"),
  media: text('rules/named-conditions', "media"),
  container: text('rules/named-conditions', "container"),
  scope: text('rules/named-conditions', "scope"),
  complement: text('rules/named-conditions', "complement"),
  customize: text('rules/named-conditions', "customize")
} as const

export { sourceNamedConditionText as namedConditionText }

function mediaQueryText(media: MasterCSSMediaQueryExpression): string {
  switch (media.type) {
    case 'feature': return media.value
    case 'media-type': return media.name
    case 'not': return `not ${mediaQueryText(media.query)}`
    case 'and': case 'or': return media.queries.map(mediaQueryText).join(` ${media.type} `)
    default: return media.type
  }
}

export function namedConditionsSheet(locale = 'en'): NamedConditionsSheet {
  const media = Object.entries(preset.customMedia ?? {}).map(([key, query]) => ({ id: `condition-${key.slice(2)}`, name: key, suffix: `@${key.slice(2)}`, query: mediaQueryText(query) }))
  const container = Object.entries(preset.customContainers ?? {}).map(([key, query]) => ({ id: `container-${key.slice(2)}`, name: key, suffix: `@container(${key})`, query }))
  const minimum = (query: string) => /^\(width\s*>=\s*[\d.]+rem\)$/.test(query)
  const maximum = (query: string) => /^not \(width\s*>=\s*[\d.]+rem\)$/.test(query)
  const byWidth = (a: { query: string }, b: { query: string }) => Number(a.query.match(/([\d.]+)rem/)?.[1]) - Number(b.query.match(/([\d.]+)rem/)?.[1])
  return {
    kind: 'named-conditions',
    groups: [
      { id: 'viewport-widths', title: text('rules/named-conditions', 'viewport-widths-title', locale), rows: media.filter(row => minimum(row.query)).sort(byWidth) },
      { id: 'below-viewport-widths', title: text('rules/named-conditions', 'below-viewport-widths-title', locale), rows: media.filter(row => maximum(row.query)).sort(byWidth) },
      { id: 'media-features', title: text('rules/named-conditions', 'media-features-title', locale), rows: media.filter(row => !minimum(row.query) && !maximum(row.query)) },
      { id: 'container-widths', title: text('rules/named-conditions', 'container-widths-title', locale), rows: container.filter(row => minimum(row.query)).sort(byWidth) },
      { id: 'below-container-widths', title: text('rules/named-conditions', 'below-container-widths-title', locale), rows: container.filter(row => maximum(row.query)).sort(byWidth) },
    ],
    usage: sheetExample('usage', 'Viewport condition', {
      lead: text('rules/named-conditions', 'usage-lead', locale),
      html: '<div class="grid-cols(1) grid-cols(3)@md gap-xs">\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Notes</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Drafts</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Archive</div>\n</div>',
    }, name => name.startsWith('grid-cols')),
    customize: sheetExample('customize', 'Independent named conditions', {
      html: '<aside class="(container-name:card) container-inline">\n  <div class="grid-cols(1) grid-cols(2)@container(card_--wide-card)">Card content</div>\n</aside>\n<div class="grid-cols(1) grid-cols(3)@tablet">Page content</div>',
    }, () => true, '@custom-media --tablet (width >= 48rem);\n@custom-container --wide-card (width >= 30rem);') as NamedConditionsSheet['customize'],
  }
}

export function namedConditionsMarkdown(sheet: NamedConditionsSheet, locale = 'en') {
  const namedConditionText = referenceEditorial(sourceNamedConditionText, 'rules/named-conditions', locale)
  const cell = (value: string) => `\`${value.replaceAll('|', '\\|')}\``
  return [
    namedConditionText.intro,
    `## ${label(locale, 'media')} {#conditions}`, namedConditionText.media,
    ...sheet.groups.map((group, index) => [
      ...(index === 3 ? [`## ${label(locale, 'container')} {#container-conditions}`, namedConditionText.container] : []),
      `### ${group.title} {#${group.id}}`,
      `| ${referenceHeader(locale, 'Suffix')} | ${referenceHeader(locale, 'Expanded query')} |\n| --- | --- |\n` + group.rows.map(row => `| <a id="${row.id}"></a> ${cell(row.suffix)} | ${cell(row.query)} |`).join('\n'),
    ].join('\n\n')),
    namedConditionText.complement,
    `## ${label(locale, 'sameName')} {#scope}`, namedConditionText.scope,
    referenceIllustrationMarkdown('condition-domains', locale),
    `## ${label(locale, 'usage')} {#usage}`, sheetExampleMarkdown(sheet.usage),
    `## ${label(locale, 'customize')} {#customize}`, namedConditionText.customize, sheetExampleMarkdown(sheet.customize),
    `${label(locale, 'see')} [${label(locale, 'grammar')}](/reference/rules/conditions), [${label(locale, 'conditionScope')}](/reference/rules/conditions#compiled-condition-definitions), [${label(locale, 'queryDefinitions')}](/reference/directives/queries#custom-container), [${label(locale, 'containerTokens')}](/reference/tokens/container)${label(locale, 'and')}[${label(locale, 'responsive')}](/guide/responsive-design).`,
  ].join('\n\n')
}

export function buildNamedConditionsContract(locale = 'en'): ReferenceDocument {
  const sheet = namedConditionsSheet(locale)
  const markdown = namedConditionsMarkdown(sheet, locale)
  const identifierAnchors = Object.fromEntries(sheet.groups.flatMap(group => group.rows.map(row => [row.suffix, row.id])))
  return {
    id: 'rules/named-conditions', kind: 'rule', title: text('rules/named-conditions', 'title', locale), category: 'Syntax', url: '/reference/rules/named-conditions',
    description: text('rules/named-conditions', 'description', locale),
    source: 'site/reference/named-conditions.ts', sourceDigest: createHash('sha256').update(JSON.stringify({ media: preset.customMedia, container: preset.customContainers })).digest('hex'),
    language: languageOf(locale), locale, aliases: Object.keys(identifierAnchors), identifierAnchors,
    terms: ['breakpoints', 'media query', 'container query', '@custom-media', '@custom-container', '斷點'], rows: [],
    examples: [sheet.usage, sheet.customize].map(({ id, title, classes, css, configuration }) => ({ id, title, classes, css, configuration })),
    related: ['rules/conditions', 'tokens/container', 'directives/theme'], guide: '/guide/responsive-design#based-on-viewport-breakpoints',
    markdown, headings: documentHeadings(markdown), extractionNotes: [], sheet,
  }
}
