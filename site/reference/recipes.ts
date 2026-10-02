import legacyRecipeAnchors from './recipe-anchors.json'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import preset from '../utils/preset-manifest'
import { generatePresetCSS } from '../common/generate-preset-css'
import { configuredMarkupClasses } from './configured-example'
import { recipeScene } from '../common/foundation-data/recipe-specimens'
import { documentHeadings } from './headings'
import type { ReferenceDocument } from './types'

/** Editorial examples; definitions, parameter syntax and CSS come from the preset. */
export const recipes = [
  { id: 'screen-readers', title: 'Screen reader text', names: ['sr-only'], classes: ['sr-only'], purpose: 'Visually hide text while retaining it in the accessibility tree. Do not apply this recipe to a control that must become visible on keyboard focus without providing its visible focus treatment.' },
  { id: 'grid-columns', title: 'Grid columns', names: ['grid-cols'], classes: ['grid-cols(3)'], purpose: 'Create a grid with equal minmax(0, 1fr) columns. The recipe also sets display:grid. Choose a positive track count for a useful layout.', guide: 'layout-system' },
  { id: 'grid-rows', title: 'Grid rows', names: ['grid-rows'], classes: ['grid-rows(3)'], purpose: 'Create equal rows and place auto-positioned items by column. The recipe sets display:grid and grid-auto-flow:column as well as the row tracks.', guide: 'layout-system' },
  { id: 'grid-column', title: 'Grid column span', names: ['grid-col-span'], classes: ['grid-col-span(2)'], purpose: 'Span columns inside an existing grid. This recipe does not create the parent grid. Use native grid-column-start and grid-column-end declarations for exact lines.', guide: 'layout-system#place-regions-intentionally' },
  { id: 'grid-row', title: 'Grid row span', names: ['grid-row-span'], classes: ['grid-row-span(2)'], purpose: 'Span rows inside an existing grid. The start and end both use the supplied span. Use a positive span for a valid native grid placement.', guide: 'layout-system#place-regions-intentionally' },
  { id: 'clamp-lines', title: 'Clamp lines', names: ['clamp-lines'], classes: ['clamp-lines(3)'], purpose: 'Limit a text block using the WebKit line-clamp pattern. The recipe sets the box display, orientation, overflow and ellipsis properties together. Keep essential information available beyond clipped previews.', guide: 'typography' },
  { id: 'text-size', title: 'Text treatments', names: ['text'], classes: ['text-md'], purpose: 'Apply font size, line height and letter spacing together. The primary token supplies size; optional companions supply line height and tracking, each falling back to normal. Family, weight and color remain separate choices.', guide: 'typography', namespace: 'text' },
  { id: 'text-gradient', title: 'Text gradient', names: ['text-gradient'], classes: ['text-gradient', 'background-image:linear-gradient(90deg,blue,red)'], purpose: 'Clip the background to glyphs and make the WebKit text fill transparent. Supply a background image or color separately; the recipe does not create a gradient. Keep a readable solid text fallback where clipping or the background is unavailable.', guide: 'colors' },
]
const fence = (lang: string, text: string) => `\`\`\`${lang}\n${text}\n\`\`\``
export async function buildRecipeContracts(siteRoot: string): Promise<ReferenceDocument[]> {
  const source = await readFile(path.join(siteRoot, '../packages/preset/src/mixins.css'), 'utf8')
  return recipes.map(recipe => {
    const definitions = recipe.names.map(name => {
      const start = source.indexOf(`@mixin --${name} `) >= 0 ? source.indexOf(`@mixin --${name} `) : source.indexOf(`@mixin --${name}(`)
      if (start < 0) throw new Error(`Missing recipe definition: ${name}`)
      const end = source.indexOf('\n@mixin ', start + 1)
      return source.slice(start, end < 0 ? undefined : end).trim()
    }).join('\n\n')
    const mixins = recipe.names.map(name => {
      const mixin = preset.mixins?.find(mixin => mixin.name === `--${name}`)
      if (!mixin) throw new Error(`Missing preset mixin: ${name}`)
      return mixin
    })
    const scene = recipeScene(recipe.id)
    const classes = configuredMarkupClasses(scene.html)
    const css = generatePresetCSS(classes)
    const parameters = mixins.map(m => `- \`${m.name}\`: ${m.parameters?.map(p => `\`${p.name}\` accepts \`<${p.syntax}>\``).join(', ') || 'no parameters'}.`).join('\n')
    const oldAnchors = (legacyRecipeAnchors as Record<string, { id: string }[]>)[recipe.id] ?? []
    const legacy = oldAnchors.filter(h => !['overview', 'examples'].includes(h.id)).map(h => `<a id="${h.id}"></a>`).join('\n\n')
    const markdown = `## Purpose {#overview}\n\n${recipe.purpose}\n\n## Example {#examples}\n\n${legacy}\n\n${scene.caption}\n\n${fence('html', scene.html)}\n\n${fence('css disclosure=generated-css', css)}\n\n## Parameters\n\n${parameters}\n\n${recipe.namespace ? `A primary \`--${recipe.namespace}-<name>\` token creates the named class. Companion tokens alone do not. An explicit call requires a quoted string, such as \`${recipe.namespace}("md")\`; an unquoted identifier fails the string parameter check. See [all values and companions](/reference/tokens/${recipe.namespace}).` : 'These definitions have no optional arguments or parameter defaults. Parameter validation and native CSS validity are separate: an integer argument does not guarantee a useful track count, span or line count.'}\n\n## Preset definition\n\n${fence('css', definitions)}\n\n## Scope and customization\n\nLoad the preset through \`@import '@master/css'\`. These top-level mixins generate utilities on demand. Project definitions with the same name replace the whole definition. Use \`@apply --name(...);\` inside a stylesheet with the same parameters, and ordinary selector/condition suffixes on classes.\n\nSee [mixin contracts](/reference/directives/definitions) for the full definition rules.${recipe.guide ? ` Learn how to choose and combine these styles in [${recipe.guide.split('#')[0]}](/guide/${recipe.guide}).` : ''}`
    return { id: recipe.id, kind: 'utility', title: recipe.title, description: recipe.purpose, category: 'Preset recipes', url: `/reference/${recipe.id}`, source: 'packages/preset/src/mixins.css', sourceDigest: createHash('sha256').update(definitions).digest('hex'), language: 'en', aliases: recipe.names.flatMap(name => [name, `--${name}`]), terms: [], rows: [], examples: [{ id: 'examples', title: recipe.title, classes, css }], related: ['directives/definitions', ...(recipe.namespace ? [`tokens/${recipe.namespace}`] : [])], guide: recipe.guide ? `/guide/${recipe.guide}` : undefined, markdown, headings: documentHeadings(markdown), extractionNotes: [] }
  })
}
