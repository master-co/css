import { createHash } from 'node:crypto'
import { foundationFamilies, foundationTokens, namespaceFamilies, namespaceTokens, hasTokenSpecimens } from '../common/foundation-data/tokens'
import { getVariableNamespacePublicKeys } from '../utils/manifest-utilities'
import preset from '../utils/preset-manifest'
import { generatePresetCSS } from '../common/generate-preset-css'
import { documentHeadings } from './headings'
import { tokenEditorial } from './token-editorial'
import type { ReferenceDocument } from './types'

const code = (text: string) => `\`${text}\``
const fence = (lang: string, text: string) => `\`\`\`${lang}\n${text}\n\`\`\``
const exampleClasses: Record<string, string> = {
  color: 'fg-blue-60', 'color-line': 'b-line-control', 'color-surface': 'bg-surface-raised', 'color-text': 'fg-text-body',
  spacing: 'px-md', container: 'max-w-md', radius: 'r-lg', shadow: 'shadow-sm',
  'font-family': 'font-family-sans', 'font-feature': 'font-feature-settings-tabular', 'font-size': 'font-size-md', 'font-weight': 'font-weight-medium',
  leading: 'leading-md', tracking: 'tracking-tight', text: 'text-md', animate: 'animate-fade', duration: 'transition-duration-fast', easing: 'transition-timing-function-smooth', content: 'content-empty',
}
function document(id: string, title: string, description: string, markdown: string, facts: unknown): ReferenceDocument {
  return { id: `tokens/${id}`, kind: 'tokens', title, description, category: 'Tokens & presets', url: `/reference/tokens/${id}`,
    source: id === 'families' ? 'crates/mastercss-engine/src/token_registry.rs' : 'packages/preset/src/default-manifest.json',
    sourceDigest: createHash('sha256').update(JSON.stringify(facts)).digest('hex'), language: 'en', aliases: [], terms: [], rows: [], examples: [],
    related: ['rules/modes', 'directives/theme'], markdown, headings: documentHeadings(markdown), extractionNotes: [] }
}
export function buildTokenContracts(): ReferenceDocument[] {
  const familyMarkdown = `## Find a family\n\nUse a canonical prefix with a named token, such as \`px-md\`. For direct values, write the complete native property: \`padding-inline:1rem\`. Prefixes are token entrances, not aliases for direct declarations. Property names in this index are searchable even when they are not legal token prefixes.\n\n\`px\` sets \`padding-inline\`; inline and block axes follow the writing mode, not always horizontal and vertical.\n\nFamilies without preset values remain available for project-defined tokens. Recipes such as [text](/reference/text-size) and [animate](/reference/animate) are mixins, not entries in this registry.\n\n## Canonical families\n\n${foundationFamilies.map(family => `### ${family.prefix} {#family-${family.prefix}}\n\nPrefix: ${code(family.prefix)}. Property: ${code(family.property)}.\n\nNamespaces: ${family.namespaces.map(ns => `[${ns}](/reference/tokens/${ns})`).join(', ')}.\n\nSyntax: ${code(`${family.prefix}-<name>`)}.`).join('\n\n')}\n\nSee the [declaration contract](/reference/rules/declarations) for encoding, direct values and errors; learn design decisions in [Design Foundations](/guide#design-foundations).`
  const families = document('families', 'Token families', 'Look up every canonical prefix, native property and token namespace.', familyMarkdown, foundationFamilies)
  families.aliases = [...new Set(foundationFamilies.flatMap(f => [f.prefix, `${f.prefix}-`, f.property, `${f.property}:`]))]
  families.identifierAnchors = Object.fromEntries([...foundationFamilies].reverse().flatMap(f => [f.prefix, `${f.prefix}-`, f.property, `${f.property}:`].map(key => [key, `family-${f.prefix}`])))
  families.terms = ['padding', 'p', 'px', 'padding-inline', '按鈕內距', '行內起點內距', 'token prefix', 'property mapping']
  const documents = [families]
  // Union the registry with values so an empty preset namespace such as order is not lost.
  const namespaces = [...new Set([...foundationTokens.map(v => v.namespace), ...foundationFamilies.flatMap(f => f.namespaces)])].filter(Boolean).sort() as string[]
  for (const namespace of namespaces) {
    const entries = namespaceTokens(namespace)
    const consumers = namespaceFamilies(namespace)
    const context = tokenEditorial[namespace]
    const recipe = ['text', 'animate'].includes(namespace) ? namespace === 'text' ? 'text-size' : 'animate' : undefined
    const sample = exampleClasses[namespace]
    const css = sample && generatePresetCSS([sample])
    if (sample && !css) throw new Error(`Empty token example: ${sample}`)
    const values = entries.map(variable => `### ${variable.key}\n\nCSS variable: ${code(`--${variable.name}`)}.\n\n${variable.values.map(({ path, value }) => fence('text', `Scope: ${path.join(' → ')}\nValue: ${value}`)).join('\n\n')}${variable.dependencies?.length ? `\n\nDependencies: ${variable.dependencies.map(name => code(`--${name}`)).join(', ')}.` : ''}`).join('\n\n')
    const markdown = `## Scope\n\nThese are authored preset values, not computed browser values. Each selector and condition is labeled separately. Project theme declarations can override them. ${context?.context ?? ''}\n\n${namespace.startsWith('color-') ? 'This lookup group uses the canonical color families. Include the role prefix in the key, for example `fg-text-body` or `bg-surface-raised`.\n\n' : ''}${hasTokenSpecimens(namespace) ? '## Specimens\n\nSelect a specimen to inspect its values below. These previews use the authored default scope; Values lists every scope, mode and dependency.\n\n' : ''}## Example\n\n${sample ? `${fence('html', `<div class="${sample}">Example</div>`)}\n\n${fence('css', css!)}` : 'The preset defines no values here. Add a named project token with `@theme`, then use the family below; use `order:1` for a direct numeric value.'}\n\n## Values\n\n${values || 'No preset values. This namespace remains available to project themes.'}\n\n## Consumers\n\n${consumers.length ? '| Prefix | Native property | Namespace |\n| --- | --- | --- |\n'+consumers.map(f => `| [${code(f.prefix)}](/reference/tokens/families#family-${f.prefix}) | ${code(f.property)} | ${f.namespaces.map(code).join(', ')} |`).join('\n') : recipe ? `The [${namespace} recipe](/reference/${recipe}) consumes primary tokens and optional companion tokens. Companion tokens alone do not create classes. Consult that page for parameters, fallback values and complete output.` : 'Use an explicit CSS variable reference.'}\n\n## Dependencies and overrides\n\nStored \`var()\` references above identify dependencies; the example includes their generated CSS. The engine follows transitive managed dependencies and retains authored scopes. A role name is a design suggestion, not a guarantee of contrast or a fixed component purpose.${namespace === 'container' ? '\n\nContainer tokens set dimensions. Native container queries contain literal thresholds and do not read these tokens. Changing `--container-md` does not change `(width>=28rem)`. See [query conditions](/reference/rules/conditions#containersize) and [Container queries](/guide/containers).' : ''}\n\nSee [variables and modes](/reference/rules/modes) and [theme directives](/reference/directives/theme).${context ? ` Learn how to choose and combine values in [${context.label}](${context.guide}).` : ''}`
    const doc = document(namespace, namespace, `Preset ${namespace} values, scopes and consumers.`, markdown, entries)
    doc.aliases = entries.flatMap(variable => [variable.key, variable.name, `--${variable.name}`])
    const anchors = new Map(doc.headings.filter(h => h.depth === 3).map(h => [h.title, h.id]))
    doc.identifierAnchors = Object.fromEntries(entries.flatMap(v => [v.key, v.name, `--${v.name}`].map(name => [name, anchors.get(v.key)!])))
    doc.terms = [namespace, ...getVariableNamespacePublicKeys(namespace)]
    if (sample) doc.examples = [{ id: 'example', title: 'Minimal example', classes: [sample], css: css! }]
    documents.push(doc)
  }
  const conditions = Object.keys(preset.customMedia ?? {}).sort()
  const markdown = `## Preset custom media\n\nThese names come from \`@custom-media\`, not theme custom properties. Width conditions query the viewport; preference and orientation conditions query their named native features. Override them with project \`@custom-media\` definitions.\n\n${conditions.map(name => `### ${name.slice(2)}\n\nUse ${code(`@${name.slice(2)}`)}. Complete generated condition:\n\n${fence('css', generatePresetCSS([`opacity:1@${name.slice(2)}`]))}`).join('\n\n')}\n\nSee [conditions](/reference/rules/conditions) for grammar and [Breakpoints](/guide/breakpoints) for choosing layout thresholds.`
  const breakpoints = document('breakpoints', 'Breakpoints and custom media', 'All preset named media conditions and their exact generated CSS.', markdown, preset.customMedia)
  breakpoints.aliases = conditions.map(name => `@${name.slice(2)}`)
  documents.push(breakpoints)
  return documents
}
