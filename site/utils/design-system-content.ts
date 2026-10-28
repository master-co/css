import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { configuredMarkupMarkdown } from '../reference/configured-example'
import { projectStyleExample, projectTokenDefinitions } from '../components/demo/project-style-examples'
import { componentCatalogMarkdown, componentGroups, materialRoles, recipeGroups, codeTableRecipeRows, canvasTreatments } from '../content/design-system/components/catalog'
import { toolingExampleMarkdown, toolingOptionsMarkdown } from './tooling-guide-data'
import { agentPromptMarkdown, previewWorkflowMarkdown } from './agent-guide-data'
import { agentFixMarkdown } from './agent-content'
import { agentStyleExample } from './agent-style-example'
import { packageTreeMarkdown } from './package-trees'
import { deliveryFlowMarkdown } from './delivery-flows'
import { firstPaintMarkdown, resourceWaterfallsMarkdown } from './first-paint-examples'
import { migrationGuidesMarkdown } from './migration-guides'
import { variableNamespaceSourcesMarkdown } from './variable-namespace-sources'
import { packageDeclaration } from './package-declaration'
import { documentValueExamples } from '../content/design-system/components/value-examples'
import { benchmarkExamplesMarkdown } from '../content/design-system/components/benchmark-examples'

export const designSystemRoutes = ['', '/authoring', ...componentGroups.flatMap(group => group.entries.map(entry => `/review/${entry.slug}`))].map(suffix => `/design-system${suffix}`)

/** Keep the overview's authored facts in search and portable documents. */
export async function designSystemContent(siteRoot: string, route: string) {
  if (!designSystemRoutes.includes(route)) throw new Error(`Unknown design-system route: ${route}`)
  // Preparation regenerates the catalog before extracting search. Read that revision,
  // rather than retaining an earlier JSON module in Node's import cache.
  const catalog = route === '/design-system/review/package-api' ? JSON.parse(await readFile(path.join(siteRoot, '.generated/reference.json'), 'utf8')) : undefined
  const tokens = projectTokenDefinitions.map(token => `| \`${token.name}\` | \`${token.value}\` |`).join('\n')
  const result = await extractReferenceMdx(path.join(siteRoot, `content${route}/content.mdx`), [], [], {
    component(name, attrs) {
      if (name === 'Workbench') {
        const example = projectStyleExample('tokens')
        return `## A small document workspace {#workspace}\n\n${configuredMarkupMarkdown(example.source, example.html)}\n\n${example.caption}\n\nThe responsive preview and its source use the same project token definitions.`
      }
      if (name === 'Materials') return materialRoles.map(role => `- **${role.name}**: \`${role.token}\`. ${role.description}`).join('\n') + '\n\nAn eight-pixel surround seats the panel. Inner radii account for the inset and the border; contact shadows and inner edge light follow the role of each surface.'
      if (name === 'Controls') return 'Native buttons, selects, sliders and radio groups keep visible focus and keyboard behavior. A selected insert fits inside a four-pixel track; pressing changes the fill and shadow without moving the label or icon. [Explore the controls](/design-system/review/controls).'
      if (name === 'DocumentPatterns') return `### Values, together\n\n| Project token | Value |\n| --- | --- |\n${tokens}\n\nNames, values and supporting details share a start. Longer source stays available in a native disclosure. [Build a complete example](/design-system/authoring).`
      if (name === 'ComponentCatalog') return componentCatalogMarkdown()
      if (name === 'CanvasTreatments') return ['| Background | Purpose |', '| --- | --- |', ...canvasTreatments.map(choice => `| \`${choice.background}\` | ${choice.description} |`)].join('\n')
      if (name === 'RecipeAppendix') return recipeGroups.map(group => `### ${group.title} {#${group.id}}\n\n[Open the complete ${group.title.toLowerCase()} collection](/design-system/authoring#${group.id}).`).join('\n\n')
      if (name === 'RecipeCatalog') return recipeGroups.map(group => `- [${group.title}](/design-system/authoring#${group.id})`).join('\n')
      if (name === 'ToolingOptions') return toolingOptionsMarkdown(String(attrs.name))
      if (name === 'ToolingExample') return toolingExampleMarkdown(String(attrs.name))
      if (name === 'AgentPrompt') return agentPromptMarkdown(String(attrs.name))
      if (name === 'AgentWorkflow') return previewWorkflowMarkdown()
      if (name === 'AgentFixExample') return agentFixMarkdown()
      if (name === 'AgentStyleExample') return `${configuredMarkupMarkdown(agentStyleExample.source, agentStyleExample.html)}\n\n${agentStyleExample.caption}`
      if (name === 'DemoViewTransition') return attrs.example === 'articles' ? '[Open the article transition preview](/guide/view-transitions#article-list-to-detail). Enter an article and return to its card; focus returns to the source card. Reduced motion uses an immediate update.' : '[Open the view selection preview](/guide/view-transitions). Choose a view; reduced motion and an unavailable API retain an immediate update.'
      if (name === 'PackageTree') return packageTreeMarkdown(String(attrs.name))
      if (name === 'DeliveryFlow') return deliveryFlowMarkdown(String(attrs.name))
      if (name === 'ResourceWaterfall') return resourceWaterfallsMarkdown()
      if (name === 'FirstPaintComparison') return firstPaintMarkdown()
      if (name === 'MigrationGuides') return migrationGuidesMarkdown()
      if (name === 'NamespaceRecipes') return variableNamespaceSourcesMarkdown(['duration', 'color-text', 'spacing'])
      if (name === 'CodeTableRecipes') return ['| Token | CSS |', '| --- | --- |', ...codeTableRecipeRows.map(row => `| \`${row.syntax}\` | \`${row.css}\` |`)].join('\n')
      if (name === 'PackageDeclarationExample') return `**${attrs.identifier}**\n\n\`\`\`typescript\n${packageDeclaration(String(attrs.identifier), catalog)}\n\`\`\``
      if (name === 'DocumentValueExamples') return documentValueExamples.map(row => `### ${row.title} {#${row.id}}\n\n\`${row.identifier}\`\n\n${row.values.map(value => `${value.label}: \`${value.value}\``).join('\n\n')}`).join('\n\n')
      if (name === 'BenchmarkChartsDemo') return benchmarkExamplesMarkdown()
    }
  })
  if (result.notes.length) throw new Error(`Incomplete ${route} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
