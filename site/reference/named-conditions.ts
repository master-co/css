import { createHash } from 'node:crypto'
import type { MasterCSSMediaQueryExpression } from '@master/css-schema/manifest'
import preset from '../utils/preset-manifest'
import { documentHeadings } from './headings'
import { sheetExample, sheetExampleMarkdown, type NamedConditionsSheet } from './sheets'
import { referenceIllustrationMarkdown } from './illustrations'
import type { ReferenceDocument } from './types'

/** One editorial source for the structured lookup and its portable exports. */
export const namedConditionText = {
  intro: 'The preset defines independent media and container conditions. They share short names, but neither registry is a set of theme tokens. A bare `@md` queries the viewport; `@container(--md)` queries an eligible ancestor container.',
  media: 'Media names come from `media.css`. Width conditions use their authored rem values; orientation and preference conditions use native media features. `@dark` and `@light` test the system preference, not a manually selected site theme.',
  container: 'Container names come from `container.css`. The definition supplies only a query condition: `@container(--md)` uses the nearest eligible container, while `@container(card|--md)` selects an eligible container named `card`. Neither form establishes a container.',
  scope: 'The same key can name different thresholds in different query domains. Container sizing tokens such as `--container-md` belong to a third, independent role: they supply lengths to sizing utilities.',
  complement: 'Each preset `max-` condition is the complement of its matching minimum condition. The expanded queries below do not overlap at the boundary. The source definitions reference their corresponding names with `not (--name)`.',
  customize: 'Declare a custom media name for a viewport or preference query, or a custom container name for a component query. Native units are retained. When replacing a condition in an already-compiled manifest, redeclare its complement too if both thresholds must change.'
} as const

function mediaQueryText(media: MasterCSSMediaQueryExpression): string {
  switch (media.type) {
    case 'feature': return media.value
    case 'media-type': return media.name
    case 'not': return `not ${mediaQueryText(media.query)}`
    case 'and': case 'or': return media.queries.map(mediaQueryText).join(` ${media.type} `)
    default: return media.type
  }
}

export function namedConditionsSheet(): NamedConditionsSheet {
  const media = Object.entries(preset.customMedia ?? {}).map(([key, query]) => ({ id: `condition-${key.slice(2)}`, name: key, suffix: `@${key.slice(2)}`, query: mediaQueryText(query) }))
  const container = Object.entries(preset.customContainers ?? {}).map(([key, query]) => ({ id: `container-${key.slice(2)}`, name: key, suffix: `@container(${key})`, query }))
  const minimum = (query: string) => /^\(width\s*>=\s*[\d.]+rem\)$/.test(query)
  const maximum = (query: string) => /^not \(width\s*>=\s*[\d.]+rem\)$/.test(query)
  const byWidth = (a: { query: string }, b: { query: string }) => Number(a.query.match(/([\d.]+)rem/)?.[1]) - Number(b.query.match(/([\d.]+)rem/)?.[1])
  return {
    kind: 'named-conditions',
    groups: [
      { id: 'viewport-widths', title: 'Minimum viewport widths', rows: media.filter(row => minimum(row.query)).sort(byWidth) },
      { id: 'below-viewport-widths', title: 'Below viewport widths', rows: media.filter(row => maximum(row.query)).sort(byWidth) },
      { id: 'media-features', title: 'Orientation and preferences', rows: media.filter(row => !minimum(row.query) && !maximum(row.query)) },
      { id: 'container-widths', title: 'Minimum container widths', rows: container.filter(row => minimum(row.query)).sort(byWidth) },
      { id: 'below-container-widths', title: 'Below container widths', rows: container.filter(row => maximum(row.query)).sort(byWidth) },
    ],
    usage: sheetExample('usage', 'Viewport condition', {
      lead: 'This layout uses one column below the preset md viewport threshold and three columns from that threshold onward.',
      html: '<div class="grid-cols(1) grid-cols(3)@md gap-xs">\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Notes</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Drafts</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Archive</div>\n</div>',
    }, name => name.startsWith('grid-cols')),
    customize: sheetExample('customize', 'Independent named conditions', {
      html: '<aside class="(container-name:card) container-inline">\n  <div class="grid-cols(1) grid-cols(2)@container(card|--wide-card)">Card content</div>\n</aside>\n<div class="grid-cols(1) grid-cols(3)@tablet">Page content</div>',
    }, () => true, '@custom-media --tablet (width >= 48rem);\n@custom-container --wide-card (width >= 30rem);') as NamedConditionsSheet['customize'],
  }
}

export function namedConditionsMarkdown(sheet: NamedConditionsSheet) {
  const cell = (value: string) => `\`${value.replaceAll('|', '\\|')}\``
  return [
    namedConditionText.intro,
    '## Media conditions {#conditions}', namedConditionText.media,
    ...sheet.groups.map((group, index) => [
      ...(index === 3 ? ['## Container conditions {#container-conditions}', namedConditionText.container] : []),
      `### ${group.title} {#${group.id}}`,
      '| Suffix | Expanded query |\n| --- | --- |\n' + group.rows.map(row => `| <a id="${row.id}"></a> ${cell(row.suffix)} | ${cell(row.query)} |`).join('\n'),
    ].join('\n\n')),
    namedConditionText.complement,
    '## Same name, different scope {#scope}', namedConditionText.scope,
    referenceIllustrationMarkdown('condition-domains'),
    '## Usage {#usage}', sheetExampleMarkdown(sheet.usage),
    '## Customize {#customize}', namedConditionText.customize, sheetExampleMarkdown(sheet.customize),
    'See [condition grammar](/reference/rules/conditions), [condition definition scope](/reference/rules/conditions#compiled-condition-definitions), [query definitions](/reference/directives/queries#custom-container), [container sizing tokens](/reference/tokens/container) and [Responsive design](/guide/responsive-design).',
  ].join('\n\n')
}

export function buildNamedConditionsContract(): ReferenceDocument {
  const sheet = namedConditionsSheet()
  const markdown = namedConditionsMarkdown(sheet)
  const identifierAnchors = Object.fromEntries(sheet.groups.flatMap(group => group.rows.map(row => [row.suffix, row.id])))
  return {
    id: 'rules/named-conditions', kind: 'rule', title: 'Named conditions', category: 'Syntax', url: '/reference/rules/named-conditions',
    description: 'Every preset media and container condition, its expanded query and the scope it measures.',
    source: 'site/reference/named-conditions.ts', sourceDigest: createHash('sha256').update(JSON.stringify({ media: preset.customMedia, container: preset.customContainers })).digest('hex'),
    language: 'en', aliases: Object.keys(identifierAnchors), identifierAnchors,
    terms: ['breakpoints', 'media query', 'container query', '@custom-media', '@custom-container', '斷點'], rows: [],
    examples: [sheet.usage, sheet.customize].map(({ id, title, classes, css, configuration }) => ({ id, title, classes, css, configuration })),
    related: ['rules/conditions', 'tokens/container', 'directives/theme'], guide: '/guide/responsive-design#based-on-viewport-breakpoints',
    markdown, headings: documentHeadings(markdown), extractionNotes: [], sheet,
  }
}
