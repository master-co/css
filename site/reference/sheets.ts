import { foundationFamilies, namespaceFamilies, namespaceTokens } from '../common/foundation-data/tokens'
import { generatePresetCSS } from '../common/generate-preset-css'
import preset from '../utils/preset-manifest'
import { configuredExampleCSS, configuredMarkupClasses } from './configured-example'
import { tokenPages, type RecipePageEditorial, type SheetExampleSource, type TokenGroupEditorial, type TokenPageEditorial } from './sheet-editorial'
import type { ReferenceExample } from './types'
import type { MasterCSSMediaQueryExpression } from '@master/css-schema/manifest'

/**
 * Structured Reference sheets: one model renders the HTML page and the portable
 * Markdown, so search, llms and the reading view share the same facts.
 */
export interface SheetSyntax { syntax: string, declarations: string, prefix?: string, property?: string }
export interface SheetExample extends ReferenceExample {
  /** Complete markup rendered in the preview. */
  html: string
  /** Displayed source: classes outside the subject collapse to an ellipsis. */
  code: string
  lead?: string
}
export interface SheetGuide { label: string, href: string }
export interface SheetValue { id: string, key: string, className: string, variable: string, value: string, cells?: string[] }
export interface SheetGroup { id: string, title?: string, namespace: string, head: string[], palette?: boolean, values: SheetValue[] }

export interface TokenSheet {
  kind: 'tokens'
  id: string
  title: string
  summary: string
  syntax: SheetSyntax[]
  /** Families beyond the primary rows, kept complete behind a disclosure. */
  more: SheetSyntax[]
  groups: SheetGroup[]
  note?: string
  usage: SheetExample
  customize: SheetExample & { configuration: string }
  guide?: SheetGuide
}

export interface RecipeSheet {
  kind: 'recipe'
  id: string
  title: string
  summary: string
  syntax: SheetSyntax[]
  more: SheetSyntax[]
  note?: string
  usage: SheetExample
  caption?: string
  definitions: string
  guide?: SheetGuide
}

export interface FamiliesSheet {
  kind: 'families'
  groups: { id: string, pages: { title: string, href: string }[], rows: { prefix: string, property: string }[] }[]
}

export interface BreakpointsSheet {
  kind: 'breakpoints'
  groups: { id: string, title: string, rows: { name: string, query: string, pixels?: string }[] }[]
  usage: SheetExample
  customize: SheetExample & { configuration: string }
}

export type ReferenceSheet = TokenSheet | RecipeSheet | FamiliesSheet | BreakpointsSheet

const code = (text: string) => `\`${text}\``
const fence = (lang: string, text: string) => `\`\`\`${lang}\n${text}\n\`\`\``
const rolePrefix = (namespace: string) => namespace.startsWith('color-') ? `${namespace.slice('color-'.length)}-` : ''
const cell = (text: string) => code(text.replaceAll('|', '\\|'))
/** The general entrance first, such as r before rtl. */
const byPrefix = <T extends { prefix: string }>(a: T, b: T) => a.prefix.length - b.prefix.length || a.prefix.localeCompare(b.prefix)

/** Pixel equivalents assume the 16px initial font size. */
export function pixels(value: string) {
  const rem = value.match(/^(-?[\d.]+)rem$/)?.[1]
  return rem === undefined ? undefined : `${+(Number(rem) * 16).toFixed(2)}px`
}

/** Display-only split of a top-level `light-dark(a, b)`; exports keep the authored value. */
export function modePair(value: string) {
  const inner = value.match(/^light-dark\((.*)\)$/)?.[1]
  if (!inner) return
  let depth = 0
  for (let index = 0; index < inner.length; index++) {
    const char = inner[index]
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === ',' && !depth) return [inner.slice(0, index).trim(), inner.slice(index + 1).trim()] as const
  }
}

/**
 * Keep the subject's classes in the displayed source and generated CSS. Other
 * classes still style the preview but read as `…`; unstyled elements drop the attribute,
 * and long sample text keeps its first words.
 */
function example(id: string, title: string, source: SheetExampleSource, subject: (name: string) => boolean, configuration = ''): SheetExample {
  // Compiling through the configured path rejects any invalid class in authored examples.
  configuredExampleCSS(configuration, configuredMarkupClasses(source.html))
  const code = source.html.replace(/ class="([^"]*)"/g, (_, value: string) => {
    const names = value.split(/\s+/).filter(Boolean)
    const kept = names.filter(subject)
    if (!kept.length) return ''
    return ` class="${kept.length < names.length ? '… ' : ''}${kept.join(' ')}"`
  }).replace(/>([^<]{49,})</g, (_, text: string) => `>${text.split(' ').slice(0, 5).join(' ')}…<`)
  const classes = configuredMarkupClasses(code).filter(subject)
  if (!classes.length) throw new Error(`Example ${title} shows no subject class`)
  const css = configuration ? configuredExampleCSS(configuration, classes) : generatePresetCSS(classes)
  return { id, title, html: source.html, code, lead: source.lead, classes, css, ...configuration ? { configuration } : {} }
}

function groupTokens(group: TokenGroupEditorial) {
  const tokens = namespaceTokens(group.namespace).filter(token => !token.key.includes('--'))
  if (group.keys === 'palette') return tokens.filter(token => /-\d+$/.test(token.key))
  if (group.keys === 'aliases') return tokens.filter(token => !/-\d+$/.test(token.key) && token.values[0].value.startsWith('var('))
  if (group.keys === 'other') return tokens.filter(token => !/-\d+$/.test(token.key) && !token.values[0].value.startsWith('var('))
  return tokens
}

export function tokenSheet(page: TokenPageEditorial): TokenSheet {
  const roles = page.id === 'color-roles'
  const syntax = new Map<string, SheetSyntax>()
  for (const group of page.groups) {
    const placeholder = `<${group.placeholder ?? 'name'}>`
    for (const family of namespaceFamilies(group.namespace).toSorted(byPrefix)) {
      // Every color family takes every role, so roles share one pattern row per family.
      const pattern = roles ? `${family.prefix}-<role>-<name>` : `${family.prefix}-${placeholder}`
      const variable = roles ? 'color-<role>-<name>' : `${group.namespace}-${placeholder}`
      const declarations = page.declarations?.[family.prefix] ?? family.properties.map(property => `${property}: var(--${variable})`).join(';\n')
      if (!syntax.has(pattern)) syntax.set(pattern, { syntax: pattern, declarations, prefix: family.prefix, property: family.property })
    }
  }
  const rows = [...syntax.values()]
  // Roles read best as one row per role, in front of the shared pattern list.
  const primary = roles
    ? page.groups.map(group => {
      const family = namespaceFamilies(group.namespace).find(family => family.prefix === group.prefix)!
      return { syntax: `${group.prefix}-${rolePrefix(group.namespace)}<name>`, declarations: `${family.property}: var(--${group.namespace}-<name>)`, prefix: group.prefix, property: family.property }
    })
    : page.primary ? page.primary.map(prefix => rows.find(row => row.prefix === prefix)!) : rows
  const groups = page.groups.map(group => {
    const role = rolePrefix(group.namespace)
    const values = groupTokens(group).map(token => {
      const className = `${group.prefix}-${role}${token.key}`
      const value = token.values[0].value
      const companions = group.namespace === 'text'
        ? ['line-height', 'letter-spacing'].map(name => namespaceTokens('text').find(other => other.key === `${token.key}--${name}`)?.values[0].value ?? 'normal')
        : undefined
      return { id: className, key: token.key, className, variable: `--${token.name}`, value, ...companions ? { cells: [value, ...companions] } : {} }
    })
    const modes = values.length > 0 && values.every(row => modePair(row.value))
    const head = group.namespace === 'text' ? ['Class', 'Size', 'Line height', 'Letter spacing'] : modes ? ['Class', 'Light', 'Dark'] : ['Class', 'Value']
    return { id: group.keys ?? group.namespace, title: group.title, namespace: group.namespace, head, palette: group.palette, values }
  })
  // Any family writing any of the page's values is a subject class: bg-green-5 and fg-green-70 alike.
  const classes = new Set(page.groups.flatMap(group => namespaceFamilies(group.namespace).flatMap(family =>
    groupTokens(group).map(token => `${family.prefix}-${rolePrefix(group.namespace)}${token.key}`))))
  const customClasses = configuredMarkupClasses(page.customize.html)
  return {
    kind: 'tokens', id: page.id, title: page.title, summary: page.summary, guide: page.guide, note: page.note,
    syntax: primary, more: rows.filter(row => !primary.some(other => other.syntax === row.syntax)), groups,
    usage: example('usage', 'Usage', page.usage, name => classes.has(name.split(/[@:]/)[0])),
    customize: example('customize', 'Customize', page.customize, name => customClasses.includes(name), page.customize.theme) as TokenSheet['customize'],
  }
}

/** Class rows read each preset definition; parameters display as their syntax placeholder. */
export function recipeSheet(page: RecipePageEditorial, source: string): RecipeSheet {
  const definitions: string[] = []
  const rows = page.names.map(name => {
    const utility = preset.utilities?.find(utility => utility.name === name)
    if (!utility) throw new Error(`Missing preset utility: ${name}`)
    const start = [`@utility ${name} `, `@utility ${name}(`].map(header => source.indexOf(header)).find(index => index >= 0) ?? -1
    if (start < 0) throw new Error(`Missing recipe definition: ${name}`)
    const block = source.slice(start, source.indexOf('\n}', start) + 2)
    definitions.push(block)
    const parameters = utility.parameters ?? []
    let declarations = block.slice(block.indexOf('{') + 1, block.lastIndexOf('}')).split('\n').map(line => line.trim()).filter(Boolean).join('\n')
    for (const parameter of parameters) declarations = declarations.replaceAll(`var(${parameter.name})`, `<${parameter.syntax}>`)
    return { name, row: { syntax: parameters.length ? `${name}(${parameters.map(parameter => `<${parameter.syntax}>`).join(', ')})` : name, declarations } }
  })
  const primary = page.primary ?? page.names
  const subject = (className: string) => page.names.some(name => className === name || className.startsWith(`${name}(`))
  return {
    kind: 'recipe', id: page.id, title: page.title, summary: page.summary, guide: page.guide, note: page.note, caption: page.caption,
    syntax: rows.filter(row => primary.includes(row.name)).map(row => row.row),
    more: rows.filter(row => !primary.includes(row.name)).map(row => row.row),
    definitions: definitions.join('\n\n'),
    usage: example('examples', 'Example', page.usage, subject),
  }
}

export function familiesSheet(): FamiliesSheet {
  const groups: FamiliesSheet['groups'] = []
  for (const page of tokenPages) {
    // A prefix may own several families, such as font- for family, size and weight.
    const families = page.groups.flatMap(group => namespaceFamilies(group.namespace))
      .filter((family, index, all) => all.findIndex(other => other.prefix === family.prefix && other.property === family.property) === index)
    const rows = families.toSorted(byPrefix).map(family => ({ prefix: family.prefix, property: family.property }))
    const link = { title: page.title, href: `/reference/tokens/${page.id}` }
    // Pages sharing the same families, such as Color and Color roles, share one group.
    const same = groups.find(group => group.rows.map(row => row.prefix).join() === rows.map(row => row.prefix).join())
    if (same) same.pages.push(link)
    else if (rows.length) groups.push({ id: page.id, pages: [link], rows })
  }
  return { kind: 'families', groups }
}

/** Every registered family appears on the index, including ones no token page groups. */
export function ungroupedFamilies(sheet: FamiliesSheet) {
  const listed = new Set(sheet.groups.flatMap(group => group.rows.map(row => `${row.prefix} ${row.property}`)))
  return foundationFamilies.filter(family => !listed.has(`${family.prefix} ${family.property}`))
}

/** The native query a resolved custom media expression stands for. */
function mediaQueryText(media: MasterCSSMediaQueryExpression): string {
  switch (media.type) {
    case 'feature': return media.value
    case 'media-type': return media.name
    case 'not': return `not ${mediaQueryText(media.query)}`
    case 'and': case 'or': return media.queries.map(mediaQueryText).join(` ${media.type} `)
    default: return media.type
  }
}

export function breakpointsSheet(): BreakpointsSheet {
  const conditions = Object.entries(preset.customMedia ?? {}).map(([name, media]) => ({ name: name.slice(2), query: mediaQueryText(media) }))
  const rem = (query: string) => Number(query.match(/([\d.]+)rem/)?.[1])
  const widths = conditions.filter(condition => /^\(width\s*>=\s*[\d.]+rem\)$/.test(condition.query)).toSorted((a, b) => rem(a.query) - rem(b.query))
  const below = conditions.filter(condition => /^not \(width\s*>=\s*[\d.]+rem\)$/.test(condition.query)).toSorted((a, b) => rem(a.query) - rem(b.query))
  return {
    kind: 'breakpoints',
    groups: [
      { id: 'viewport-widths', title: 'Viewport widths', rows: widths.map(row => ({ ...row, pixels: pixels(row.query.match(/([\d.]+rem)/)![1]) })) },
      { id: 'below-viewport-widths', title: 'Below viewport widths', rows: below },
      { id: 'media-features', title: 'Media features', rows: conditions.filter(condition => !widths.includes(condition) && !below.includes(condition)) },
    ],
    usage: example('usage', 'Usage', {
      lead: 'Change a layout at a breakpoint.',
      html: '<div class="grid-cols(1) grid-cols(3)@md gap-xs">\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Notes</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Drafts</div>\n  <div class="p-sm r-lg b(1) b-solid b-line-divider text-sm fg-text-body">Archive</div>\n</div>',
    }, name => name.includes('@')),
    customize: example('customize', 'Customize', {
      lead: 'Change a preset condition or add one with native custom media: `--tablet` creates `@tablet`.',
      html: '<div class="grid-cols(2)@tablet">…</div>',
    }, name => name.includes('@tablet'), '@custom-media --tablet (width >= 48rem);') as BreakpointsSheet['customize'],
  }
}

function exampleMarkdown(sheet: SheetExample, source = true) {
  return [sheet.lead, sheet.configuration && fence('css', sheet.configuration), source && fence('html', sheet.code), fence('css disclosure=generated-css', sheet.css)].filter(Boolean).join('\n\n')
}

function classesMarkdown(rows: SheetSyntax[], linked: boolean) {
  // Token pages also name each property on its own, so a property lookup finds its row.
  if (linked) return `| Class | Property | Declarations |\n| --- | --- | --- |\n${rows.map(row => `| [${cell(row.syntax)}](/reference/tokens/families#family-${row.prefix}) | ${cell(row.property!)} | ${row.declarations.split('\n').map(cell).join(' ')} |`).join('\n')}`
  return `| Class | Declarations |\n| --- | --- |\n${rows.map(row => `| ${cell(row.syntax)} | ${row.declarations.split('\n').map(cell).join(' ')} |`).join('\n')}`
}

const seeAlso = (links: string[]) => `See ${links.join(' and ')}.`

export function tokenSheetMarkdown(sheet: TokenSheet) {
  const values = sheet.groups.map(group => {
    const head = group.namespace === 'text' ? ['Class', 'Variable', 'Size', 'Line height', 'Letter spacing'] : ['Class', 'Variable', 'Value']
    const rows = group.values.map(row => `| ${cell(row.className)} | ${cell(row.variable)} | ${(row.cells ?? [row.value]).map(cell).join(' | ')} |`).join('\n')
    return `${group.title && sheet.groups.length > 1 ? `### ${group.title} {#${group.id}}\n\n` : ''}| ${head.join(' | ')} |\n| ${head.map(() => '---').join(' | ')} |\n${rows}`
  }).join('\n\n')
  return [
    '## Classes {#consumers}',
    classesMarkdown([...sheet.syntax, ...sheet.more], true),
    sheet.note,
    '## Values {#values}',
    values,
    '## Usage {#usage}',
    exampleMarkdown(sheet.usage),
    '## Customize {#customize}',
    exampleMarkdown(sheet.customize, false),
    seeAlso(['[theme directives](/reference/directives/theme)', ...sheet.guide ? [`[${sheet.guide.label}](${sheet.guide.href})`] : []]),
  ].filter(Boolean).join('\n\n')
}

export function recipeSheetMarkdown(sheet: RecipeSheet) {
  return [
    '## Classes {#overview}',
    classesMarkdown([...sheet.syntax, ...sheet.more], false),
    sheet.note,
    '## Example {#examples}',
    exampleMarkdown(sheet.usage),
    sheet.caption,
    '## Customize {#customize}',
    'The preset defines these classes with `@utility`. Define the same name in your stylesheet to replace it.',
    fence('css', sheet.definitions),
    seeAlso(['[utility definitions](/reference/directives/definitions)', ...sheet.guide ? [`[${sheet.guide.label}](${sheet.guide.href})`] : []]),
  ].filter(Boolean).join('\n\n')
}

export function familiesSheetMarkdown(sheet: FamiliesSheet) {
  const rest = ungroupedFamilies(sheet)
  const table = (rows: { prefix: string, property: string }[]) => `| Prefix | Property |\n| --- | --- |\n${rows.map(row => `| ${cell(`${row.prefix}-`)} | ${cell(row.property)} |`).join('\n')}`
  return [
    'Each prefix writes native properties from a token namespace, such as `p-md`. Write any other value as a native declaration, such as `(padding:1rem)`.',
    ...sheet.groups.map(group => `## ${group.pages.map(page => page.title).join(' and ')} {#${group.id}}\n\n${table(group.rows)}\n\nValues in ${group.pages.map(page => `[${page.title}](${page.href})`).join(' and ')}.`),
    ...rest.length ? [`## Other families {#other}\n\n${table(rest.toSorted(byPrefix))}`] : [],
  ].join('\n\n')
}

export function breakpointsSheetMarkdown(sheet: BreakpointsSheet) {
  return [
    '## Conditions {#conditions}',
    'Append a condition to any class with `@`, such as `grid-cols(3)@md`. These are preset `@custom-media` definitions, not theme variables.',
    ...sheet.groups.map(group => `### ${group.title} {#${group.id}}\n\n| Condition | Query |\n| --- | --- |\n${group.rows.map(row => `| ${cell(`@${row.name}`)} | ${cell(row.query)}${row.pixels ? ` ${row.pixels}` : ''} |`).join('\n')}`),
    '## Usage {#usage}',
    exampleMarkdown(sheet.usage),
    '## Customize {#customize}',
    exampleMarkdown(sheet.customize, false),
    seeAlso(['[conditions](/reference/rules/conditions)', '[Breakpoints](/guide/responsive-design#based-on-viewport-breakpoints)']),
  ].join('\n\n')
}
