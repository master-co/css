import { getThemeVariables } from '../utils/theme-variables'

/** Brand identity facts shared by the page, search and Markdown: the approved artwork, its gold and its typefaces. Preset values stay in the preset. */
export const brandArtwork = {
  mark: { width: 216.6, height: 120 },
  logotype: { width: 1197.53, height: 130.26 },
} as const

/** Endpoints of the mark's vertical field; each SVG retains its intermediate stops. */
export const brandMarkGradientStops = {
  light: ['#FDE2A7', '#E6B65D'],
  dark: ['#FCDD98', '#E6B65D'],
} as const

/** The interface's gold signal, from the preset amber family; `styles/brand.css` paints it so the token is delivered. */
export const brandSignalToken = 'amber-40'

/** The mark's gradients beside the signal, which is read from the public preset rather than copied. */
export function brandGold(): { title: string, value: string, paint?: string }[] {
  if (!getThemeVariables('color').some(entry => entry.key === brandSignalToken)) throw new Error(`Missing brand signal token: ${brandSignalToken}`)
  return [
    { title: 'Mark on light', paint: `linear-gradient(${brandMarkGradientStops.light.join(', ')})`, value: brandMarkGradientStops.light.join(' → ') },
    { title: 'Mark on dark', paint: `linear-gradient(${brandMarkGradientStops.dark.join(', ')})`, value: brandMarkGradientStops.dark.join(' → ') },
    { title: 'Signal', value: `--color-${brandSignalToken}` },
  ]
}

export const brandMinimums = [
  { kind: 'small-mark', title: 'Small mark', height: 16 },
  { kind: 'mark', title: 'Mark', height: 24 },
  { kind: 'logotype', title: 'Logotype', height: 16 },
] as const

export const brandTypefaces = [
  { family: 'Geist', role: 'Interface and Latin text', sample: 'Aa' },
  { family: 'Noto Sans TC', role: 'Traditional Chinese', sample: '永', lang: 'zh-Hant' },
  { family: 'IBM Plex Mono', role: 'Code, identifiers and aligned numbers', sample: '{ }', mono: true },
] as const

export const brandKit = { src: '/brand/v2/master-css-brand-kit-v2.zip', manifest: '/brand/v2/manifest.json' } as const

export const brandAssets = [
  { title: 'Logotype for dark backgrounds', description: 'Light lettering with the champagne-to-gold mark.', src: '/images/css-logotype@dark.svg', alt: 'Master CSS logotype with light lettering', ...brandArtwork.logotype, surface: 'dark' as const },
  { title: 'Logotype for light backgrounds', description: 'Dark lettering with the champagne-to-gold mark.', src: '/images/css-logotype@light.svg', alt: 'Master CSS logotype with dark lettering', ...brandArtwork.logotype, surface: 'light' as const },
  { title: 'Mark for dark backgrounds', description: 'Standard flat mark, for heights of 24px and above.', src: '/images/logo.svg', alt: 'Master CSS gold mark for dark backgrounds', ...brandArtwork.mark, surface: 'dark' as const },
  { title: 'Mark for light backgrounds', description: 'Standard flat mark, for heights of 24px and above.', src: '/brand/v2/logo/mark/master-mark-on-light.svg', alt: 'Master CSS gold mark for light backgrounds', ...brandArtwork.mark, surface: 'light' as const },
  { title: 'Small mark for dark backgrounds', description: 'Wider gaps for heights from 16px to below 24px.', src: '/brand/v2/logo/mark/master-mark-small-on-dark.svg', alt: 'Small Master CSS mark for dark backgrounds', ...brandArtwork.mark, surface: 'dark' as const },
  { title: 'Small mark for light backgrounds', description: 'Wider gaps for heights from 16px to below 24px.', src: '/brand/v2/logo/mark/master-mark-small-on-light.svg', alt: 'Small Master CSS mark for light backgrounds', ...brandArtwork.mark, surface: 'light' as const },
] as const
