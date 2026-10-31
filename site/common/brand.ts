/** Site identity and presentation decisions. Preset values stay in the preset. */
export const brandSections = [
  { id: 'identity', number: '01', title: 'Identity', titleTW: '品牌識別' },
  { id: 'logo-system', number: '02', title: 'Logo system', titleTW: '標誌系統' },
  { id: 'color-system', number: '03', title: 'Color', titleTW: '色彩' },
  { id: 'typography', number: '04', title: 'Typography', titleTW: '字體排印' },
  { id: 'layout-and-materials', number: '05', title: 'Layout & materials', titleTW: '版式與材質' },
  { id: 'interaction', number: '06', title: 'Interaction', titleTW: '互動' },
  { id: 'applications', number: '07', title: 'In use', titleTW: '品牌應用' },
  { id: 'voice', number: '08', title: 'Voice', titleTW: '品牌語氣' },
  { id: 'download-assets', number: '09', title: 'Downloads', titleTW: '素材下載' },
  { id: 'trademark-policy', number: '10', title: 'Usage policy', titleTW: '使用政策' },
] as const

export const brandPrinciples = [
  { title: 'Clarity in the foreground', description: 'The work comes first. Give text, code and data a clear place; let the interface support them.' },
  { title: 'A system you can read', description: 'Make relationships visible. Shared values, consistent rhythm and deliberate states connect the parts.' },
  { title: 'Precision with warmth', description: 'Keep the structure neutral and the details considered. Gold brings a small, recognizable point of warmth.' },
] as const

export const brandLogoMinimums = { markHeight: 16, regularMarkHeight: 24, lockupHeight: 16, lockupWidth: 1197.53 / 130.26 * 16 } as const
export const brandLogoGeometry = [
  { title: 'Standalone mark', viewBox: '0 0 216.6 120', ratio: '216.6 : 120' },
  { title: 'Horizontal lockup', viewBox: '0 -128 1197.53 130.26', ratio: '1197.53 : 130.26' },
] as const

export const brandLogoRules = [
  { title: 'Clear space', value: '½ H / x', description: 'Leave half the mark’s height around a standalone mark. Leave one wordmark x-height around a complete lockup; the mark is 1.3 times that x-height.' },
  { title: 'Mark minimum', value: `${brandLogoMinimums.markHeight}px high`, description: 'Use the small-size artwork from 16px to below 24px high. Use the standard mark from 24px high. Check its silhouette at the final rendered size.' },
  { title: 'Lockup minimum', value: `${brandLogoMinimums.lockupHeight}px high`, description: 'Keep the horizontal lockup at least 16 CSS pixels high, or 25mm wide in print, so its lettering remains readable.' },
] as const

export const brandColorRoles = [
  { title: 'Canvas', token: '--color-surface-canvas', description: 'The quiet ground around the work.', family: 'surface' },
  { title: 'Shell', token: '--color-surface-shell', description: 'A close surround that groups related surfaces.', family: 'surface' },
  { title: 'Raised', token: '--color-surface-raised', description: 'An opaque surface for controls and content.', family: 'surface' },
  { title: 'Floating', token: '--color-surface-floating', description: 'A surface above the page, such as a menu or dialog.', family: 'surface' },
  { title: 'Strong text', token: '--color-text-strong', description: 'Titles, important values and active navigation.', family: 'text' },
  { title: 'Body text', token: '--color-text-body', description: 'The default reading voice.', family: 'text' },
  { title: 'Muted text', token: '--color-text-muted', description: 'Supporting text that remains readable.', family: 'text' },
  { title: 'Divider', token: '--color-line-divider', description: 'A boundary between related regions.', family: 'line' },
  { title: 'Control edge', token: '--color-line-control', description: 'An identifiable boundary for a real control.', family: 'line' },
] as const

export const brandFunctionalColors = [
  { title: 'Success', token: '--color-text-success', description: 'A completed check or confirmed outcome.' },
  { title: 'Information', token: '--color-text-info', description: 'Useful context beside the task.' },
  { title: 'Error', token: '--color-text-danger', description: 'A problem that needs attention.' },
] as const

/** Endpoints of the shared vertical field; each SVG retains its intermediate stops. */
export const brandMarkGradientStops = {
  dark: ['#FCDD98', '#E6B65D'],
  light: ['#FDE2A7', '#E6B65D'],
} as const

export const brandKit = { src: '/brand/v2/master-css-brand-kit-v2.zip', manifest: '/brand/v2/manifest.json' } as const

export const brandRoleOrigins = {
  '--color-surface-canvas': 'Site role',
  '--color-surface-shell': 'Site role',
  '--color-text-success': 'Site role',
  '--color-text-info': 'Site role',
  '--color-text-danger': 'Site role',
} as const

export const brandRoleGuidance = 'Canvas, Shell and the functional text colors are roles defined by this website. The remaining neutral roles shown here come from the Master CSS preset. Copying a variable uses the definition in your theme; it does not install a site-specific role.'

export const brandTypeRoles = [
  { title: 'Display', token: '--font-size-5xl', sample: 'A clear point of view.', description: 'A short opening thought. Give it room; use it once.' },
  { title: 'Page title', token: '--font-size-3xl', sample: 'A system, in plain sight.', description: 'Name the subject and establish the reading hierarchy.' },
  { title: 'Section', token: '--font-size-2xl', sample: 'The details belong together', description: 'A new idea, separated by space rather than decoration.' },
  { title: 'Body', token: '--font-size-md', sample: 'Style in markup. Keep your decisions close to the work.', description: 'A comfortable reading size, with space for a complete thought.' },
  { title: 'Supporting', token: '--font-size-sm', sample: 'One shared language. 一套共同的設計語言。', description: 'Descriptions, controls and short supporting information.' },
  { title: 'Label', token: '--font-size-xs', sample: 'Release notes / 024', description: 'Compact navigation labels, metadata and captions. Keep their actions large enough to use.' },
  { title: 'Code', token: '--font-size-sm', sample: 'grid gap-md p-lg', description: 'IBM Plex Mono keeps syntax and values easy to distinguish.' },
] as const

export const brandVoiceExamples = [
  { context: 'Introduce the product', lang: 'en', preferred: 'Style in markup with class names and design tokens.', avoid: 'The ultimate, revolutionary styling experience.' },
  { context: 'Guide an action', lang: 'en', preferred: 'Copy the color variable.', avoid: 'Unlock your palette’s full potential.' },
  { context: 'Explain a result', lang: 'en', preferred: 'Copied var(--color-surface-raised).', avoid: 'Success! Everything is ready to go.' },
  { context: 'Write in Traditional Chinese', lang: 'zh-Hant', preferred: '在標記中編寫樣式，使用共用的設計 tokens。', avoid: '透過極致創新的方案，全面賦能設計體驗。' },
] as const

export const brandAssets = [
  { title: 'Logotype for dark backgrounds', description: 'Light lettering with the champagne-to-gold mark.', src: '/images/css-logotype@dark.svg', alt: 'Master CSS logotype with light lettering', width: 1197.53, height: 130.26, surface: 'dark' as const },
  { title: 'Logotype for light backgrounds', description: 'Dark lettering with the champagne-to-gold mark.', src: '/images/css-logotype@light.svg', alt: 'Master CSS logotype with dark lettering', width: 1197.53, height: 130.26, surface: 'light' as const },
  { title: 'Mark for dark backgrounds', description: 'Standard flat mark, for heights of 24px and above.', src: '/images/logo.svg', alt: 'Master CSS gold mark for dark backgrounds', width: 216.6, height: 120, surface: 'dark' as const },
  { title: 'Mark for light backgrounds', description: 'Standard flat mark, for heights of 24px and above.', src: '/brand/v2/logo/mark/master-mark-on-light.svg', alt: 'Master CSS gold mark for light backgrounds', width: 216.6, height: 120, surface: 'light' as const },
  { title: 'Small mark for dark backgrounds', description: 'Wider gaps for heights from 16px to below 24px.', src: '/brand/v2/logo/mark/master-mark-small-on-dark.svg', alt: 'Small Master CSS mark for dark backgrounds', width: 216.6, height: 120, surface: 'dark' as const },
  { title: 'Small mark for light backgrounds', description: 'Wider gaps for heights from 16px to below 24px.', src: '/brand/v2/logo/mark/master-mark-small-on-light.svg', alt: 'Small Master CSS mark for light backgrounds', width: 216.6, height: 120, surface: 'light' as const },
] as const

export const brandExampleMarkup = '<section class="grid gap-md p-lg r-xl bg-surface-raised">\n  <h2 class="m(0) text-xl fg-text-strong">A shared language</h2>\n  <p class="m(0) text-sm fg-text-muted">Keep the decisions close to the work.</p>\n  <a class="fg-text-link" href="/guide">Explore the Guide</a>\n</section>'
