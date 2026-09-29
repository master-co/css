import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { sizingRoles } from '../common/foundation-data/sizing/scale-data'

export const foundationGuideSlugs = [
  'spacing', 'sizing', 'breakpoints', 'containers', 'corner-radius', 'responsive-design',
  'layout-system', 'colors', 'elevation', 'typography', 'motion'
] as const

// These visual specimens have complete authored explanations and portable examples
// beside them. Data-bearing components below always receive a text adapter.
const visualComponents = new Set([
  'FoundationSizing', 'FoundationAxes', 'FoundationShrink', 'FoundationBreakpoint',
  'FoundationContainerGrid', 'FoundationRadius', 'FoundationShapes', 'FoundationMedia',
  'FoundationColorRoles', 'FoundationSurfaces', 'FoundationLines', 'FoundationTextRoles',
  'FoundationHue', 'FoundationTextHue', 'FoundationElevation', 'FoundationElevationState',
  'FoundationTypography', 'FoundationTypeComparison', 'FoundationMotion',
  'FoundationTransition', 'FoundationDialog', 'ShadowScaleDemo',
  // Original Guide specimens restored from HEAD. Each has adjacent teaching copy.
  'ResizeZone', 'IFrame', 'SurfacesDemo', 'LineRolesDemo', 'TextRolesDemo',
  'BaseHueDemo', 'TextHueDemo', 'SurfaceElevationDemo', 'NaturalMaterials'
])
function foundationComponent(_slug: string, name: string, _attributes: Record<string, unknown>) {
  if (visualComponents.has(name)) return ''
  if (name === 'SizingRoleTable') return sizingRoles.map(row => `- \`${row.utility}\` — ${row.role}. ${row.description}`).join('\n')
}

/** No JSX execution: authored MDX, native generated CSS and the same data as SSR. */
export async function foundationGuideContent(siteRoot: string, slug: string) {
  if (!foundationGuideSlugs.includes(slug as typeof foundationGuideSlugs[number])) throw new Error(`Unsupported foundation guide: ${slug}`)
  const result = await extractReferenceMdx(path.join(siteRoot, `app/[locale]/guide/${slug}/content.mdx`), [], [], {
    overview: 'include', component: (name, attributes) => foundationComponent(slug, name, attributes)
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
