import { foundationFamilies, namespaceFamilies, namespaceTokens } from '../common/foundation-data/tokens'
import { generatePresetCSS } from '../common/generate-preset-css'
import preset from '../utils/preset-manifest'
import { configuredExampleCSS, configuredMarkupClasses } from './configured-example'
import { familyText } from './family-editorial'
import { referenceIllustrationMarkdown } from './illustrations'
import { tokenPages, type RecipePageEditorial, type SheetExampleSource, type TokenGroupEditorial, type TokenPageEditorial } from './sheet-editorial'
import type { ReferenceExample } from './types'

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
  explanation?: TokenPageEditorial['explanation']
  valuesLead?: string
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
  groups: { id: string, pages: { title: string, href: string }[], rows: FamilyRow[] }[]
  usage: SheetExample
}

export interface FamilyRow { prefix: string, namespace: string, property: string }

export interface NamedConditionsSheet {
  kind: 'named-conditions'
  groups: { id: string, title: string, rows: { id: string, name: string, suffix: string, query: string }[] }[]
  usage: SheetExample
  customize: SheetExample & { configuration: string }
}

export type ReferenceSheet = TokenSheet | RecipeSheet | FamiliesSheet | NamedConditionsSheet

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
export function sheetExample(id: string, title: string, source: SheetExampleSource, subject: (name: string) => boolean, configuration = ''): SheetExample {
  // Compiling through the configured path rejects any invalid class in authored examples.
  configuredExampleCSS(configuration, configuredMarkupClasses(source.html))
  const code = source.html.replace(/ class="([^"]*)"/g, (_, value: string) => {
    const names = value.split(/\s+/).filter(Boolean)
    const kept = names.filter(name => subject(name) || source.keep?.includes(name))
    if (!kept.length) return ''
    return ` class="${kept.length < names.length ? '… ' : ''}${kept.join(' ')}"`
  }).replace(/>([^<]{49,})</g, (_, text: string) => `>${text.split(' ').slice(0, 5).join(' ')}…<`)
  const classes = configuredMarkupClasses(code).filter(name => subject(name) || source.keep?.includes(name))
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
    kind: 'tokens', id: page.id, title: page.title, summary: page.summary, guide: page.guide, note: page.note, explanation: page.explanation, valuesLead: page.valuesLead,
    syntax: primary, more: rows.filter(row => !primary.some(other => other.syntax === row.syntax)), groups,
    usage: sheetExample('usage', 'Usage', page.usage, name => classes.has(name.split(/[@:]/)[0])),
    customize: sheetExample('customize', 'Customize', page.customize, name => customClasses.includes(name), page.customize.theme) as TokenSheet['customize'],
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
    usage: sheetExample('examples', 'Usage', page.usage, subject),
  }
}

export function familiesSheet(): FamiliesSheet {
  const groups: FamiliesSheet['groups'] = []
  for (const page of tokenPages) {
    // A prefix may own several families, such as font- for family, size and weight.
    const families = page.groups.flatMap(group => namespaceFamilies(group.namespace))
      .filter((family, index, all) => all.findIndex(other => other.prefix === family.prefix && other.namespace === family.namespace) === index)
    const rows = families.toSorted(byPrefix).map(family => ({ prefix: family.prefix, namespace: family.namespace, property: family.property }))
    const link = { title: page.title, href: `/reference/tokens/${page.id}` }
    // Pages sharing the same families, such as Color and Color roles, share one group.
    const same = groups.find(group => JSON.stringify(group.rows) === JSON.stringify(rows))
    if (same) same.pages.push(link)
    else if (rows.length) groups.push({ id: page.id, pages: [link], rows })
  }
  return { kind: 'families', groups, usage: sheetExample('reading-a-family', 'Same key, different tokens', {
    html: '<div class="p-md max-w-md font-md">Content</div>'
  }, () => true) }
}

/** Every registered family appears on the index, including ones no token page groups. */
export function ungroupedFamilies(sheet: FamiliesSheet) {
  const listed = new Set(sheet.groups.flatMap(group => group.rows.map(row => `${row.prefix} ${row.namespace}`)))
  return foundationFamilies.filter(family => !listed.has(`${family.prefix} ${family.namespace}`))
}

/** Complete example content, shared by structured sheets and portable exports. */
export function sheetExampleMarkdown(sheet: SheetExample, source = true) {
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
    sheet.valuesLead,
    values,
    ...sheet.explanation ? [
      `## ${sheet.explanation.title} {#${sheet.explanation.id}}`,
      sheet.explanation.paragraphs[0],
      referenceIllustrationMarkdown(sheet.explanation.illustration),
      ...sheet.explanation.paragraphs.slice(1),
      sheet.explanation.links?.length ? seeAlso(sheet.explanation.links.map(link => `[${link.label}](${link.href})`)) : '',
    ] : [],
    '## Usage {#usage}',
    sheetExampleMarkdown(sheet.usage),
    '## Customize {#customize}',
    sheetExampleMarkdown(sheet.customize, false),
    seeAlso(['[theme directives](/reference/directives/theme)', ...sheet.guide ? [`[${sheet.guide.label}](${sheet.guide.href})`] : []]),
  ].filter(Boolean).join('\n\n')
}

export function recipeSheetMarkdown(sheet: RecipeSheet) {
  return [
    '## Classes {#overview}',
    classesMarkdown([...sheet.syntax, ...sheet.more], false),
    sheet.note,
    '## Usage {#examples}',
    sheetExampleMarkdown(sheet.usage),
    sheet.caption,
    '## Customize {#customize}',
    'The preset defines these classes with `@utility`. Define the same name in your stylesheet to replace it.',
    fence('css', sheet.definitions),
    seeAlso(['[utility definitions](/reference/directives/definitions)', ...sheet.guide ? [`[${sheet.guide.label}](${sheet.guide.href})`] : []]),
  ].filter(Boolean).join('\n\n')
}

export function familiesSheetMarkdown(sheet: FamiliesSheet) {
  const rest = ungroupedFamilies(sheet)
  const seen = new Set<string>()
  const table = (rows: FamilyRow[]) => `| Prefix | Token namespace | Properties |\n| --- | --- | --- |\n${rows.map(row => {
    const anchor = seen.has(row.prefix) ? '' : `<a id="family-${row.prefix}"></a>`
    seen.add(row.prefix)
    return `| ${anchor}${cell(`${row.prefix}-`)} | ${cell(`--${row.namespace}-*`)} | ${cell(row.property)} |`
  }).join('\n')}`
  return [
    familyText.intro,
    '## Read a family {#reading-a-family}',
    familyText.mapping,
    referenceIllustrationMarkdown('namespace-lookup'),
    sheetExampleMarkdown(sheet.usage),
    familyText.lookup,
    ...sheet.groups.map(group => `## ${group.pages.map(page => page.title).join(' and ')} {#${group.id}}\n\n${table(group.rows)}\n\nValues in ${group.pages.map(page => `[${page.title}](${page.href})`).join(' and ')}.`),
    ...rest.length ? [`## Other families {#other}\n\n${table(rest.toSorted(byPrefix))}`] : [],
    '## Resolution boundaries {#resolution-boundaries}',
    familyText.shared,
    familyText.registration,
    familyText.roles,
    familyText.limits,
    seeAlso(['[token registration and resolution](/reference/rules/modes#namespace-resolution)', '[utility definitions](/reference/directives/definitions#utilities)', '[declaration forms](/reference/rules/declarations)', '[building a theme](/guide/theme#define-tokens)']),
  ].join('\n\n')
}
