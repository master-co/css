import { createHash } from 'node:crypto'
import { foundationFamilies, foundationTokens, namespaceFamilies, namespaceTokens, hasTokenSpecimens } from '../common/foundation-data/tokens'
import { getVariableNamespacePublicKeys } from '../utils/manifest-utilities'
import preset from '../utils/preset-manifest'
import { generatePresetCSS } from '../common/generate-preset-css'
import { documentHeadings } from './headings'
import { tokenEditorial } from './token-editorial'
import { foundationScene, specimenCaption, tokenAdvice } from '../common/foundation-data/specimens'
import { configuredExampleCSS, configuredMarkupClasses } from './configured-example'
import type { ReferenceDocument } from './types'

const code = (text: string) => `\`${text}\``
const fence = (lang: string, text: string) => `\`\`\`${lang}\n${text}\n\`\`\``
const exampleKeys: Record<string, string[]> = {
  color: ['blue-60'], 'color-line': ['control'], 'color-surface': ['raised'], 'color-text': ['body'],
  spacing: ['sm', 'md', 'lg'], container: ['md'], radius: ['lg', 'pill'], shadow: ['sm'],
  'font-family': ['sans'], 'font-feature': ['tabular'], 'font-size': ['md'], 'font-weight': ['medium'],
  leading: ['md'], tracking: ['tight'], text: ['md'], animate: ['fade'], duration: ['fast'], easing: ['smooth'], content: ['empty'],
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
  // Union the registry with values so registry namespaces remain discoverable even when a future preset has no values.
  const namespaces = [...new Set([...foundationTokens.map(v => v.namespace), ...foundationFamilies.flatMap(f => f.namespaces)])].filter(Boolean).sort() as string[]
  for (const namespace of namespaces) {
    const entries = namespaceTokens(namespace)
    const consumers = namespaceFamilies(namespace)
    const context = tokenEditorial[namespace]
    const recipe = ['text', 'animate'].includes(namespace) ? namespace === 'text' ? 'text-size' : 'animate' : undefined
    const scene = foundationScene(namespace, exampleKeys[namespace])
    if (namespace === 'spacing') scene.html = '<form class="display:grid gap-lg p-lg"><label class="display:grid gap-sm">Name<input type="text" class="p-sm" /></label><label class="display:grid gap-sm">Email<input type="email" class="p-sm" /></label><button type="button" class="px-md py-sm">Save profile</button></form>'
    const classes = configuredMarkupClasses(scene.html)
    const css = configuredExampleCSS(scene.css ?? '', classes)
    const advice = entries.filter(token => !token.key.includes('--')).flatMap(token => tokenAdvice(namespace, token.key) ? [`- ${code(token.key)} — ${tokenAdvice(namespace, token.key)}`] : []).join('\n')
    const values = entries.map(variable => `### ${variable.key}\n\nCSS variable: ${code(`--${variable.name}`)}.\n\n${variable.values.map(({ path, value }) => fence('text', `Scope: ${path.join(' → ')}\nValue: ${value}`)).join('\n\n')}${variable.dependencies?.length ? `\n\nDependencies: ${variable.dependencies.map(name => code(`--${name}`)).join(', ')}.` : ''}`).join('\n\n')
    const markdown = `## Scope\n\nThese are authored preset values, not computed browser values. Each selector and condition is labeled separately. Project theme declarations can override them. ${context?.context ?? ''}\n\n${namespace.startsWith('color-') ? 'This lookup group uses the canonical color families. Include the role prefix in the key, for example `fg-text-body` or `bg-surface-raised`.\n\n' : ''}${hasTokenSpecimens(namespace) ? `## Specimens\n\n${specimenCaption[namespace]}\n\n${advice ? `${advice}\n\n` : ''}Values below list every authored scope and dependency.\n\n` : ''}## Example\n\n${scene.css ? `${fence('css', scene.css)}\n\n` : ''}${fence('html', scene.html)}\n\n${fence('css', css)}\n\n## Values\n\n${values || 'No preset values. This namespace remains available to project themes.'}\n\n## Consumers\n\n${consumers.length ? '| Prefix | Native property | Namespace |\n| --- | --- | --- |\n'+consumers.map(f => `| [${code(f.prefix)}](/reference/tokens/families#family-${f.prefix}) | ${code(f.property)} | ${f.namespaces.map(code).join(', ')} |`).join('\n') : recipe ? `The [${namespace} recipe](/reference/${recipe}) consumes primary tokens and optional companion tokens. Companion tokens alone do not create classes. Consult that page for parameters, fallback values and complete output.` : 'Use an explicit CSS variable reference.'}\n\n## Dependencies and overrides\n\nStored \`var()\` references above identify dependencies; the example includes their generated CSS. The engine follows transitive managed dependencies and retains authored scopes. A role name is a design suggestion, not a guarantee of contrast or a fixed component purpose.${namespace === 'container' ? '\n\nContainer tokens set dimensions. Native container queries contain literal thresholds and do not read these tokens. Changing `--container-md` does not change `(width>=28rem)`. See [query conditions](/reference/rules/conditions#containersize) and [Container queries](/guide/containers).' : ''}\n\nSee [variables and modes](/reference/rules/modes) and [theme directives](/reference/directives/theme).${context ? ` Learn how to choose and combine values in [${context.label}](${context.guide}).` : ''}`
    const doc = document(namespace, namespace, `Preset ${namespace} values, scopes and consumers.`, markdown, entries)
    doc.aliases = entries.flatMap(variable => [variable.key, variable.name, `--${variable.name}`])
    const anchors = new Map(doc.headings.filter(h => h.depth === 3).map(h => [h.title, h.id]))
    doc.identifierAnchors = Object.fromEntries(entries.flatMap(v => [v.key, v.name, `--${v.name}`].map(name => [name, anchors.get(v.key)!])))
    doc.terms = [namespace, ...getVariableNamespacePublicKeys(namespace)]
    doc.examples = [{ id: 'example', title: 'Working example', classes, configuration: scene.css || undefined, css }]
    documents.push(doc)
  }
  const conditions = Object.keys(preset.customMedia ?? {}).sort()
  const markdown = `## Specimens\n\nPreset viewport width thresholds. Pixel equivalents assume a 16px root; these are custom media definitions, not theme custom properties. Every exact condition, including non-width queries, follows below.\n\n## Preset custom media\n\nThese names come from \`@custom-media\`, not theme custom properties. Width conditions query the viewport; preference and orientation conditions query their named native features. Override them with project \`@custom-media\` definitions.\n\n${conditions.map(name => `### ${name.slice(2)}\n\nUse ${code(`@${name.slice(2)}`)}. Complete generated condition:\n\n${fence('css', generatePresetCSS([`opacity:1@${name.slice(2)}`]))}`).join('\n\n')}\n\nSee [conditions](/reference/rules/conditions) for grammar and [Breakpoints](/guide/breakpoints) for choosing layout thresholds.`
  const breakpoints = document('breakpoints', 'Breakpoints and custom media', 'All preset named media conditions and their exact generated CSS.', markdown, preset.customMedia)
  breakpoints.aliases = conditions.map(name => `@${name.slice(2)}`)
  documents.push(breakpoints)
  return documents
}
