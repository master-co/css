import { translateSite } from './translations'
import { responsiveIllustrationMarkdown } from '../content/guide/responsive-design/illustration'
import { layoutIllustrationMarkdown } from '../content/guide/layout-system/illustration'
import { typeIllustrationMarkdown } from '../content/guide/typography/illustration'
import { colorIllustrationMarkdown } from '../content/guide/colors/illustration'
import { localizedContentFile } from './localized-content'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { sizingRoles } from '@master/internal-site/css/foundation-data/sizing/scale-data.ts'
import { paletteKeys } from '@master/internal-site/css/foundation-data/tokens.ts'
import { selectedSpecimensMarkdown } from '@master/internal-site/css/foundation-data/specimen-content.ts'

export const foundationGuideSlugs = ['colors', 'typography', 'layout-system', 'responsive-design'] as const

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
  'SurfacesDemo', 'LineRolesDemo', 'TextRolesDemo',
  'BaseHueDemo', 'TextHueDemo', 'SurfaceElevationDemo'
])
function foundationComponent(_slug: string, name: string, _attributes: Record<string, unknown>, t: (text: string) => string) {
  if (name === 'ResponsiveIllustration') return responsiveIllustrationMarkdown()
  if (name === 'LayoutIllustration') return layoutIllustrationMarkdown()
  if (name === 'TypeIllustration') return typeIllustrationMarkdown()
  if (name === 'ColorIllustration') return colorIllustrationMarkdown()
  if (name === 'FoundationPalette') return selectedSpecimensMarkdown('color', paletteKeys, t)
  if (visualComponents.has(name)) return ''
  if (name === 'SizingRoleTable') return sizingRoles.map(row => `- \`${row.utility}\` — ${t(row.role)}. ${t(row.description)}`).join('\n')
}

/** No JSX execution: authored MDX, native generated CSS and the same data as SSR. */
export async function foundationGuideContent(siteRoot: string, slug: string, locale = 'en') {
  if (!foundationGuideSlugs.includes(slug as typeof foundationGuideSlugs[number])) throw new Error(`Unsupported foundation guide: ${slug}`)
  const result = await extractReferenceMdx(await localizedContentFile(siteRoot, `content/guide/${slug}/content.mdx`, locale), [], [], {
    overview: 'include', component: (name, attributes) => foundationComponent(slug, name, attributes, text => translateSite(locale, text))
  })
  if (result.notes.length) throw new Error(`Incomplete ${slug} export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
