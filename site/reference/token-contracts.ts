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
  'font-family': ['sans'], 'font-size': ['md'], 'font-weight': ['medium'],
  leading: ['md'], tracking: ['tight'], text: ['md'], animate: ['fade'], duration: ['fast'], easing: ['smooth'],
}
function document(id: string, title: string, description: string, markdown: string, facts: unknown): ReferenceDocument {
  return { id: `tokens/${id}`, kind: 'tokens', title, description, category: 'Tokens & presets', url: `/reference/tokens/${id}`,
    source: id === 'families' ? 'packages/preset/src/mixins.css' : 'packages/preset/src/default-manifest.json',
    sourceDigest: createHash('sha256').update(JSON.stringify(facts)).digest('hex'), language: 'en', aliases: [], terms: [], rows: [], examples: [],
    related: ['rules/modes', 'directives/theme'], markdown, headings: documentHeadings(markdown), extractionNotes: [] }
}
export function buildTokenContracts(): ReferenceDocument[] {
  const familyMarkdown = `## Find a family\n\nUse a canonical prefix with a named token, such as \`px-md\`. For direct values, write the complete native property: \`padding-inline:1rem\`. Prefixes are token entrances, not aliases for direct declarations. Property names in this index are searchable even when they are not legal token prefixes.\n\n\`px\` sets \`padding-inline\`; inline and block axes follow the writing mode, not always horizontal and vertical.\n\nFamilies loaded from mixins remain registered even without preset values; class completion requires a matching token. Import @master/css/mixins.css alongside a custom theme, or author your own definitions. All families are mixins. Direct-value parameters receive CSS values; the [text recipe](/reference/text-size) receives a string key; the [animate family](/reference/tokens/animate) maps complete animation shorthands to the native animation property.\n\n## Canonical families\n\n${foundationFamilies.map(family => `### ${family.prefix} {#family-${family.prefix}}\n\nPrefix: ${code(family.prefix)}. Property: ${code(family.property)}.\n\nNamespaces: ${family.namespaces.map(ns => `[${ns}](/reference/tokens/${ns})`).join(', ')}.\n\nSyntax: ${code(`${family.prefix}-<name>`)}.`).join('\n\n')}\n\nSee the [declaration contract](/reference/rules/declarations) for encoding, direct values and errors; learn design decisions in [Design Foundations](/guide#design-foundations).`
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
    const recipe = namespace === 'text' ? 'text-size' : undefined
    const scene = foundationScene(namespace, exampleKeys[namespace])
    if (namespace === 'spacing') scene.html = '<form class="display:grid gap-lg p-lg"><label class="display:grid gap-sm">Name<input type="text" class="p-sm" /></label><label class="display:grid gap-sm">Email<input type="email" class="p-sm" /></label><button type="button" class="px-md py-sm">Save profile</button></form>'
    const classes = configuredMarkupClasses(scene.html)
    const css = configuredExampleCSS(scene.css ?? '', classes)
    const advice = entries.filter(token => !token.key.includes('--')).flatMap(token => tokenAdvice(namespace, token.key) ? [`- ${code(token.key)} — ${tokenAdvice(namespace, token.key)}`] : []).join('\n')
    const values = entries.map(variable => `### ${variable.key}\n\nCSS variable: ${code(`--${variable.name}`)}.\n\n${variable.values.map(({ path, value }) => fence('text', `Scope: ${path.join(' → ')}\nValue: ${value}`)).join('\n\n')}${variable.dependencies?.length ? `\n\nDependencies: ${variable.dependencies.map(name => code(`--${name}`)).join(', ')}.` : ''}`).join('\n\n')
    const animationContract = namespace === 'animate' ? `\n\n## Animation contract\n\nEach token supplies a complete native animation shorthand. Tokens declared with \`inline\` substitute their value once; \`static\` retains the token and its referenced keyframes without a consumer. Without \`inline\`, \`animate-<name>\` emits \`animation: var(--animate-<name>)\`; omitted fields use native CSS defaults. Preset values explicitly repeat infinitely. Project tokens may include multiple comma-separated animations and references to duration or easing tokens.\n\nTo customize a full animation, define \`--animate-reveal: reveal var(--duration-fast) ease-out both\` in \`@theme\` and use \`animate-reveal@motion-safe\`. Declare the matching keyframes outside the theme block and add \`@prune native;\` in their owning file for on-demand delivery. In a stylesheet, write \`animation: var(--animate-reveal)\` directly.\n\nFor a single-field override, use \`animate-fade animation-duration:var(--duration-fast) animation-iteration-count:1\`. At the same layer and conditions, token longhands such as \`animation-duration-fast\` sort before the animation shorthand and are reset by it. Full-property declarations follow tokens under the general ordering rules; class attribute order does not change their priority. Match condition suffixes when combining classes.\n\nAnimation declarations retain referenced managed keyframes and their transitive token dependencies across authored scopes and fallbacks. Unresolved dynamic names retain all managed keyframes. Keyframes are preserved by default. Their owning file can opt into \`@prune native\`; \`@preserve native\` wins and \`@safelist keyframes "name";\` retains a JavaScript-only name. Same-name definitions keep their conditions, layers and native order. See [native keyframes](/reference/directives/theme#native-keyframes).` : ''
    const markdown = `## Scope\n\nThese are authored preset values, not computed browser values. Tokens use the default \`:root, :host\` scope. Project theme declarations define values; native selectors and conditions provide scoped overrides. ${context?.context ?? ''}\n\n${namespace.startsWith('color-') ? 'This lookup group uses the canonical color families. Include the role prefix in the key, for example `fg-text-body` or `bg-surface-raised`.\n\n' : ''}${hasTokenSpecimens(namespace) ? `## Specimens\n\n${specimenCaption[namespace]}\n\n${advice ? `${advice}\n\n` : ''}Values below list every ordered declaration and dependency.\n\n` : ''}## Example\n\n${scene.css ? `${fence('css', scene.css)}\n\n` : ''}${fence('html', scene.html)}\n\n${fence('css disclosure=generated-css', css)}\n\n## Values\n\n${values || 'No preset values. This namespace remains available to project themes.'}\n\n## Consumers\n\n${consumers.length ? '| Prefix | Native property | Namespace |\n| --- | --- | --- |\n'+consumers.map(f => `| [${code(f.prefix)}](/reference/tokens/families#family-${f.prefix}) | ${code(f.property)} | ${f.namespaces.map(code).join(', ')} |`).join('\n') : recipe ? `The [${namespace} recipe](/reference/${recipe}) consumes primary tokens and optional companion tokens. Companion tokens alone do not create classes. Consult that page for parameters, fallback values and complete output.` : 'Use an explicit CSS variable reference.'}\n\n## Dependencies and overrides\n\nStored \`var()\` references above identify dependencies; the example includes their generated CSS. The engine follows transitive managed dependencies and retains ordered token declarations. A role name is a design suggestion, not a guarantee of contrast or a fixed component purpose.${animationContract}${namespace === 'container' ? '\n\nContainer tokens set dimensions. Native container queries contain literal thresholds and do not read these tokens. Changing `--container-md` does not change `(width>=28rem)`. See [query conditions](/reference/rules/conditions#containersize) and [Container queries](/guide/containers).' : ''}\n\nSee [variables and modes](/reference/rules/modes) and [theme directives](/reference/directives/theme).${context ? ` Learn how to choose and combine values in [${context.label}](${context.guide}).` : ''}`
    const doc = document(namespace, namespace, `Preset ${namespace} values, scopes and consumers.`, markdown, entries)
    doc.aliases = entries.flatMap(variable => [variable.key, variable.name, `--${variable.name}`])
    const anchors = new Map(doc.headings.filter(h => h.depth === 3).map(h => [h.title, h.id]))
    doc.identifierAnchors = Object.fromEntries(entries.flatMap(v => [v.key, v.name, `--${v.name}`].map(name => [name, anchors.get(v.key)!])))
    doc.terms = [namespace, ...getVariableNamespacePublicKeys(namespace)]
    doc.examples = [{ id: 'example', title: 'Working example', classes, configuration: scene.css || undefined, css }]
    documents.push(doc)
  }
  const conditions = Object.keys(preset.customMedia ?? {}).sort()
  const markdown = `## Specimens\n\nPreset viewport width thresholds. Pixel equivalents assume a 16px root; these are custom media definitions, not theme custom properties. Every exact condition, including non-width queries, follows below.\n\n## Preset custom media\n\nThese names come from \`@custom-media\`, not theme custom properties. Width conditions query the viewport; preference and orientation conditions query their named native features. Override them with project \`@custom-media\` definitions.\n\n${conditions.map(name => `### ${name.slice(2)}\n\nUse ${code(`@${name.slice(2)}`)}. Complete generated condition:\n\n${fence('css disclosure=generated-css', generatePresetCSS([`opacity:1@${name.slice(2)}`]))}`).join('\n\n')}\n\nSee [conditions](/reference/rules/conditions) for grammar and [Breakpoints](/guide/breakpoints) for choosing layout thresholds.`
  const breakpoints = document('breakpoints', 'Breakpoints and custom media', 'All preset named media conditions and their exact generated CSS.', markdown, preset.customMedia)
  breakpoints.aliases = conditions.map(name => `@${name.slice(2)}`)
  documents.push(breakpoints)
  return documents
}
