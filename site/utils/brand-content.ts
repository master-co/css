import path from 'node:path'
import { extractReferenceMdx, portableMarkdown } from '../reference/markdown'
import { brandAssets, brandColorRoles, brandExampleMarkup, brandFunctionalColors, brandLogoGeometry, brandLogoRules, brandMarkGradientStops, brandPrinciples, brandRoleGuidance, brandTypeRoles, brandVoiceExamples } from '../common/brand'
import { brandPalette, brandScale, brandTiming } from '../common/brand-foundations'

function table(headings: string[], rows: string[][]) {
  return [`| ${headings.join(' | ')} |`, `| ${headings.map(() => '---').join(' | ')} |`, ...rows.map(row => `| ${row.join(' | ')} |`)].join('\n')
}

/** The same authored decisions and preset facts feed the page and its portable form. */
export function brandComponentMarkdown(name: string) {
  if (name === 'BrandPrinciples') return brandPrinciples.map(item => `### ${item.title}\n\n${item.description}`).join('\n\n')
  if (name === 'BrandLogoSystem') return [
    'The complete signature uses the original horizontal logotype.',
    ...brandLogoRules.map(rule => `### ${rule.title}\n\n**${rule.value}**. ${rule.description}`),
    table(['Artwork', 'Original SVG canvas ratio'], brandLogoGeometry.map(geometry => [geometry.title, geometry.ratio])),
    'The visual guide shows both minimum sizes at actual CSS pixel dimensions. Check the mark and lettering where they will be used.',
    'Use the supplied artwork, keep its proportions, and choose the lettering for its background. Do not redraw, stretch, rotate, recolor or add effects. Clear space stays clear of text and edges.'
  ].join('\n\n')
  if (name === 'BrandColors') return [
    '### The signature: gold',
    `The original logo keeps its own artwork and gradients. The standalone mark’s central ribbon has gradient endpoints ${brandMarkGradientStops.join(' and ')}; all intermediate stops stay in the SVG. Interface gold uses the preset amber family.`,
    table(['Palette token', 'Authored value'], brandPalette().map(color => [`\`${color.token}\``, `\`${color.value}\``])),
    '### Roles that follow the theme',
    brandRoleGuidance,
    table(['Role', 'Variable', 'Purpose'], brandColorRoles.map(role => [role.title, `\`${role.token}\``, role.description])),
    '### Functional color',
    'Name the outcome in words; color reinforces its meaning. These website roles adapt to the mode. The visual guide shows their current rendered values and offers the same variable-copy feedback as the neutral roles.',
    table(['State', 'Website variable', 'Purpose'], brandFunctionalColors.map(role => [role.title, `\`${role.token}\``, role.description])),
    'Copy a variable to preserve its adaptive relationship. The visual page displays the current browser-rendered color alongside its role.'
  ].join('\n\n')
  if (name === 'BrandTypography') return [
    'Geist: Latin and interface text. Noto Sans TC: Traditional Chinese. IBM Plex Mono: code and identifiers.',
    table(['Role', 'Size token', 'Value', 'Pixels at a 16px root', 'Specimen', 'Use'], brandTypeRoles.map(role => {
      const size = brandScale('font-size', [role.token.slice('--font-size-'.length)])[0]
      return [role.title, `\`${role.token}\``, `\`${size.value}\``, String(size.px), role.sample, role.description]
    })),
    'A comfortable reading column keeps paragraphs together. Chinese keeps natural tracking and punctuation. Use tabular figures for aligned numbers, including 012,345.67 and 108,902.34.'
  ].join('\n\n')
  if (name === 'BrandGeometry') return [
    table(['Spacing', 'Value', 'Pixels at a 16px root'], brandScale('spacing', ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl']).map(entry => [`\`${entry.token}\``, `\`${entry.value}\``, String(entry.px)])),
    table(['Radius', 'Value'], brandScale('radius', ['md', 'lg', 'xl', '2xl', '3xl']).map(entry => [`\`${entry.token}\``, `\`${entry.value}\``])),
    'At a 16px root, a fitted shell has an 8px inset. A 24px shell radius surrounds a 16px panel; include a physical border in the inner-face measurement.',
    'Flat: one clear boundary. Raised: a short contact shadow. Floating: more distance for menus and dialogs. Glass: local to floating tools with a real backdrop.'
  ].join('\n\n')
  if (name === 'BrandControls') return 'Native List and Grid radios change the specimen layout. A range changes its content inset from 12px to 32px. Copy token writes the displayed `var(--color-surface-raised)` and reports a pending request, then success or failure; Unavailable is disabled. Selection persists, pressing acknowledges an action, and a focus ring follows the keyboard. Labels and control geometry remain stable.'
  if (name === 'BrandMotion') return table(['Duration token', 'Value'], brandTiming().map(entry => [`\`${entry.token}\``, `\`${entry.value}\``]))
  if (name === 'BrandApplications') return [
    '### Documentation',
    'A shared language. Keep the decisions close to the work. Start with readable markup, then give shared values a name. [Write your first class](/guide/introduction).',
    '### Reference',
    table(['Token', 'Value', 'Use'], brandScale('spacing', ['sm', 'md', 'lg']).map((entry, index) => [`\`${entry.token}\``, `\`${entry.value}\``, ['Related details', 'A comfortable inset', 'Space between groups'][index]])),
    '### In markup', `\`\`\`html\n${brandExampleMarkup}\n\`\`\``,
    '### Announcement',
    'Clear by design. One language for the system. Room for what you make. Master CSS — css.master.co. [Read the Blog](/blog).'
  ].join('\n\n')
  if (name === 'BrandVoice') return table(['Context', 'Clear and useful', 'Avoid'], brandVoiceExamples.map(example => [example.context, example.preferred, example.avoid]))
  if (name === 'BrandDownloads') return [
    '### Logotype {#logotype}',
    ...brandAssets.slice(0, 2).map(asset => `**${asset.title}**\n\n${asset.description}\n\n![${asset.alt}](${asset.src})\n\n[Download ${asset.title} (SVG)](${asset.src})`),
    '### Mark {#mark}',
    `**${brandAssets[2].title}**\n\n${brandAssets[2].description}\n\n![${brandAssets[2].alt}](${brandAssets[2].src})\n\n[Download ${brandAssets[2].title} (SVG)](${brandAssets[2].src})`,
    'The checkerboard indicates transparency and is not part of the downloaded file.'
  ].join('\n\n')
}

/** Export actual asset labels and URLs without executing presentation components. */
export async function brandContent(siteRoot: string) {
  const result = await extractReferenceMdx(path.join(siteRoot, 'content/brand/content.mdx'), [], [], {
    component(name, attrs) {
      const content = brandComponentMarkdown(name)
      if (content !== undefined) return content
      if (name !== 'DemoAsset') return
      for (const key of ['title', 'description', 'src', 'alt']) {
        if (typeof attrs[key] !== 'string') throw new Error(`DemoAsset requires a literal ${key}`)
      }
      if (attrs.format !== undefined && typeof attrs.format !== 'string') throw new Error('DemoAsset requires a literal format')
      return `**${attrs.title}**\n\n${attrs.description}\n\n![${attrs.alt}](${attrs.src})\n\n[Download ${attrs.title} (${attrs.format ?? 'SVG'})](${attrs.src})`
    }
  })
  if (result.notes.length) throw new Error(`Incomplete Brand export: ${result.notes.join('; ')}`)
  return { ...result, searchMarkdown: result.markdown, markdown: portableMarkdown(result.markdown) }
}
