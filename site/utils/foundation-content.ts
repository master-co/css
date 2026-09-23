import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { getThemeNumericVariableEntries, getThemeVariables } from './theme-variables'
import { filterNamespaceKeys } from './manifest-utilities'
import { presetBreakpointConditions, presetContainerConditions } from '../common/preset-css'
import generateManifestCondition from './generate-manifest-condition'
import { groups as spacingGroups } from '../app/[locale]/guide/spacing/components/namespace-groups'
import { groups as containerGroups } from '../app/[locale]/guide/containers/components/namespace-groups'
import { groups as radiusGroups } from '../app/[locale]/guide/corner-radius/components/namespace-groups'
import { groups as colorGroups } from '../app/[locale]/guide/colors/components/namespace-groups'
import { groups as shadowGroups } from '../app/[locale]/guide/elevation/components/namespace-groups'
import { groups as typographyGroups } from '../app/[locale]/guide/typography/components/namespace-groups'
import { groups as motionGroups } from '../app/[locale]/guide/motion/components/namespace-groups'
import { sizingRoles, containerDescriptions } from '../app/[locale]/guide/sizing/components/scale-data'
import { descriptions as breakpointDescriptions } from '../app/[locale]/guide/breakpoints/components/scale-data'
import { descriptions as containerRoles } from '../app/[locale]/guide/containers/components/scale-data'
import { radiusRoles } from '../app/[locale]/guide/corner-radius/components/scale-data'
import { rowsByGroup, rowDescriptionByGroup, type PresetThemeColorGroup } from '../app/[locale]/guide/colors/components/color-data'
import { getShadowRows } from '../app/[locale]/guide/elevation/components/shadow-data'
import { getAnimationRows } from '../app/[locale]/guide/motion/components/animation-data'
import { getDurationRows } from '../app/[locale]/guide/motion/components/duration-data'
import { getEasingRows } from '../app/[locale]/guide/motion/components/easing-data'
import { getFontWeightRows } from '../app/[locale]/guide/typography/components/font-weight-data'
import type { NamespaceUtilityGroup } from '../components/NamespaceUtilityTable'

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
  'BaseHueDemo', 'TextHueDemo', 'SurfaceElevationDemo'
])
const namespaceGroups: Record<string, NamespaceUtilityGroup[]> = {
  SpacingHeirs: spacingGroups, ContainerNamespaceTable: containerGroups,
  RadiusNamespaceTable: radiusGroups, ColorNamespaceTable: colorGroups,
  ShadowNamespaceTable: shadowGroups, TypographyNamespaceTable: typographyGroups,
  MotionNamespaceTable: motionGroups
}
const tokenRows = {
  AnimationTokenTable: getAnimationRows, DurationTokenTable: getDurationRows,
  EasingTokenTable: getEasingRows, FontWeightTokens: getFontWeightRows
}
const code = (text: string | number) => `\`${text}\``
const length = (value: number, unit: string) => `${Number(value.toFixed(4))}${unit}`

function numericScale(namespace: string, descriptions: Record<string, string> = {}) {
  const entries = getThemeNumericVariableEntries(namespace)
  const referenceUnit = entries.every(entry => entry.unit === 'rem') ? 'px' : 'rem'
  return entries.map(entry => `- ${code(`--${namespace}-${entry.key}`)}: ${code(entry.value)} (${length(entry[referenceUnit], referenceUnit)} reference).${descriptions[entry.key] ? ` ${descriptions[entry.key]}` : ''}`).join('\n')
}

function queryScale(namespace: 'breakpoint' | 'container') {
  const conditions = namespace === 'breakpoint' ? presetBreakpointConditions : presetContainerConditions
  return getThemeNumericVariableEntries(namespace).map(entry => {
    const variant = namespace === 'breakpoint' ? `@${entry.key}` : `@container(${entry.key})`
    return `- ${code(variant)}: ${length(entry.px, 'px')} / ${length(entry.rem, 'rem')}; ${code(generateManifestCondition(conditions[entry.key]))}.`
  }).join('\n')
}

function foundationComponent(slug: string, name: string, attributes: Record<string, unknown>) {
  if (visualComponents.has(name)) return ''
  if (name === 'Overview' && slug === 'spacing') return numericScale('spacing')
  if (Object.hasOwn(namespaceGroups, name)) return namespaceGroups[name].flatMap(group => {
    const keys = filterNamespaceKeys(group)
    return keys.length ? [`- ${group.label}: ${keys.map(code).join(', ')}.${group.description ? ` ${group.description}` : ''}`] : []
  }).join('\n')
  if (Object.hasOwn(tokenRows, name)) return tokenRows[name as keyof typeof tokenRows]().map(row =>
    `- ${code(row.token)} / ${row.utilities.map(code).join(', ')}: ${code(row.value)}. ${row.description}`
  ).join('\n')
  if (name === 'SizingRoleTable') return sizingRoles.map(row => `- ${row.utility.split(', ').map(code).join(', ')} — ${row.role}. ${row.description}`).join('\n')
  if (name === 'ContainerTokenTable') return numericScale('container', containerDescriptions)
  if (name === 'BreakpointVariables') return numericScale('breakpoint', breakpointDescriptions)
  if (name === 'ContainerVariables') return numericScale('container', containerRoles)
  if (name === 'RadiusTokenTable') return numericScale('radius', radiusRoles)
  if (name === 'BreakpointQueries') return queryScale('breakpoint')
  if (name === 'ContainerQueries') return queryScale('container')
  if (name === 'ContainerSizeValues') return getThemeNumericVariableEntries('container').map(entry =>
    `- ${code(entry.key)} / ${code(`container-${entry.key}`)}: ${length(entry.px, 'px')} / ${length(entry.rem, 'rem')}; example ${code(`max-w:${entry.key}`)}.`
  ).join('\n')
  if (name === 'DemoPalette' || name === 'ColorPalette') return getThemeVariables('color').filter(variable => /^color-.+-\d+$/.test(variable.name ?? '')).map(variable =>
    `- ${code(`--${variable.name}`)}: ${code(String(variable.value))}.`
  ).join('\n')
  if (name === 'PresetThemeColors') {
    const group = attributes.group as PresetThemeColorGroup
    if (!Object.hasOwn(rowsByGroup, group)) throw new Error(`Unknown preset color group: ${group}`)
    return rowsByGroup[group].map(row => `- ${code(row.token)} / ${row.utilities.map(code).join(', ')}: ${rowDescriptionByGroup[group](row.key)} Light: ${code(row.light)}. Dark: ${code(row.dark)}.`).join('\n')
  }
  if (name === 'ShadowTokenTable') return getShadowRows().map(row => `- ${code(row.token)} / ${code(row.utility)} — ${row.role}. ${row.description}`).join('\n')
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
