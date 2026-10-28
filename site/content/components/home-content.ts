import colorNames from '~/site/docs-shell/data/color-names'
import { COLOR_LEVELS, getColor } from '~/site/docs-shell/data/color-palette'

export type DeliveryModeId = 'static' | 'progressive' | 'runtime'

export type HomeSectionId = typeof homeSections[keyof typeof homeSections]

export type HomeCodeWindowProblemSeverity = 'error' | 'info' | 'warning'

export interface HomeCodeWindowProblem {
  location: string
  message: string
  severity: HomeCodeWindowProblemSeverity
  source: string
}

export interface DesignSystemTileContent {
  title: string
  body: string
  gridColumnClassName?: string
  visual: 'theme-modes' | 'theme-variables' | 'art-gallery' | 'cascade-layers'
}

export interface DesignSystemRowContent {
  title: string
  gridClassName: string
  tiles?: readonly DesignSystemTileContent[]
  body?: string
  visual?: 'p3-palette'
}

export interface DeliveryModeContent {
  id: DeliveryModeId
  title: string
  body: string
  href: string
  /** Where the CSS is generated for this mode. */
  stage: string
  /** What reaches the browser. */
  artifacts: readonly string[]
  default?: boolean
}

export interface LintRuleContent {
  title: string
  body: string
  /** A short state beside the rule: what kind of check it is. */
  tag: 'Error' | 'Autofix' | 'Opt-in' | 'MCP'
  file: string
  code: string
  /** The text the problem points at, underlined in the sample; `fixMark` marks what the fix changed. */
  mark?: string
  fixMark?: string
  /** The source after the fix the rule offers, and what the fix did. */
  fixPreviewCode?: string
  fix?: string
  problem: HomeCodeWindowProblem
}

export interface LanguageServiceCardContent {
  title: string
  body: string
  visual: 'hover-inspection' | 'manifest-aware-suggestions' | 'active-syntax-highlighting' | 'color-tools'
}

export interface WorkflowCardContent {
  title: string
  body: string
}

export interface McpToolContent {
  name: string
  body: string
}

/** Section anchors in page order. */
export const homeSections = {
  hero: 'hero',
  designSystem: 'design-system',
  languageService: 'language-service',
  deliveryModes: 'delivery-modes',
  cssCost: 'css-cost',
  codeDiagnostics: 'code-diagnostics',
  agents: 'ai-agents',
  developmentWorkflow: 'development-workflow',
  getStarted: 'get-started'
} as const

export const installCommand = 'npm create @master/css@rc'

/** Classes the hero composer types, in authoring order, onto its preview button. */
export const heroComposerTokens = [
  'bg-yellow',
  'fg-yellow-95',
  'px-lg',
  'py-sm',
  'r-pill',
  'font-semibold',
  'shadow-lg',
  'display:inline-flex',
  'align-items:center',
  'gap-xs'
] as const

/** The same classes after the `sort-classes` autofix. */
export const heroComposerSortedTokens = [
  'display:inline-flex',
  'align-items:center',
  'gap-xs',
  'py-sm',
  'px-lg',
  'r-pill',
  'font-semibold',
  'bg-yellow',
  'fg-yellow-95',
  'shadow-lg'
] as const

export const heroComposerProblem = `Sort classes into the expected order: "${heroComposerSortedTokens.join(' ')}".`

/** Real classes, linted by the tests, that the character matrices are written in. */
export const ctaClassRows = [
  ['display:grid', 'gap-lg', 'grid-cols(3)@md', 'p-xl', 'r-3xl', 'bg-surface-raised', 'shadow-lg', 'fg-text-strong'],
  ['text-2xl', 'font-semibold', 'tracking-tight', 'fg-blue-60:hover', 'outline-width:2px:focus-visible', 'transition-normal', 'opacity:0@starting-style'],
  ['container-type:inline-size', 'display:none@media(print)', 'bg-blue-60/0.2', '-mt-sm', 'clamp-lines(2)', 'fg-text-muted', 'r-pill', 'px-lg']
] as const

/** Rows of class text for the character matrices behind the hero and the call to action. */
export const glyphFieldLines = ctaClassRows.map((row) => `${row.join('   ')}   `)

export const themeVariablesCode = `@theme {
  --font-family-sans: "Inter", sans-serif; /* font-sans */

  --spacing-md: 1rem;   /* p-md */
  --spacing-lg: 1.5rem; /* p-lg */
  --radius-xl: 0.75rem; /* r-xl */

  /* bg-surface-base, in light and dark */
  --color-surface-base: light-dark(
    var(--color-zinc-0),
    var(--color-zinc-95)
  );
}
`

/** The preset layer order, bottom to top, with what typically lives in each layer. */
export const cascadeLayers = [
  { name: 'theme', example: '--spacing-md: 1rem' },
  { name: 'base', example: 'h1, p { margin: 0 }' },
  { name: 'defaults', example: 'body { color: var(--color-text-body) }' },
  { name: 'components', example: '.btn { @apply --control }' },
  { name: 'utilities', example: '.px-lg  .bg-yellow' }
] as const

export const p3PaletteColorNames = [...colorNames].reverse()

export const p3PaletteTiers = [...COLOR_LEVELS].reverse()

export const designSystemRows = [
  {
    title: 'Tokenized themes',
    gridClassName: 'grid-cols(1) grid-cols(2)@md',
    tiles: [
      {
        title: 'Light and dark, same markup',
        body: 'Modes swap token values, not class names. Drag the divider to see which value is in use.',
        visual: 'theme-modes'
      },
      {
        title: 'Tokens, defined once',
        body: 'Set color, spacing, radius and type in @theme. Utilities, components and modes all read from them.',
        visual: 'theme-variables'
      }
    ]
  },
  {
    title: 'Wide-gamut color',
    body: 'P3 palettes on a predictable tier scale, from deep anchors to bright accents.',
    gridClassName: 'grid-cols(1)',
    visual: 'p3-palette'
  },
  {
    title: 'Modern CSS primitives',
    gridClassName: 'grid-cols(1) grid-cols(3)@md',
    tiles: [
      {
        title: 'Layout and motion, together',
        body: 'Grid, responsive spans, animation and view transitions, written right beside the UI.',
        gridColumnClassName: 'grid-col-span(2)@md',
        visual: 'art-gallery'
      },
      {
        title: 'Native CSS, in predictable layers',
        body: 'Write components in native CSS with mixins and nesting. Utilities come in a later layer, so a class in markup wins without !important.',
        visual: 'cascade-layers'
      }
    ]
  }
] satisfies readonly DesignSystemRowContent[]

export const deliveryModes = [
  {
    id: 'static',
    title: 'Static rendering',
    body: 'Scan class names at build time and ship a plain stylesheet. No runtime in the browser.',
    href: '/guide/rendering-modes#static-rendering',
    stage: 'Build',
    artifacts: ['app.css'],
    default: true
  },
  {
    id: 'progressive',
    title: 'Progressive rendering',
    body: 'Render first-load CSS on the server or at build time. The runtime starts its engine only for classes outside that CSS.',
    href: '/guide/rendering-modes#progressive-rendering',
    stage: 'Server',
    artifacts: ['style#master-css', 'hydration manifest']
  },
  {
    id: 'runtime',
    title: 'Runtime rendering',
    body: 'Generate rules in the browser for classes that first appear there, from editors, CMS content or playgrounds.',
    href: '/guide/rendering-modes#runtime-rendering',
    stage: 'Browser',
    artifacts: ['MasterCSSRuntime']
  }
] satisfies readonly DeliveryModeContent[]

/** Class names that travel through the delivery diagram. */
export const deliveryFlowPackets = ['p-lg', 'r-xl', 'gap-md', 'grid-cols(3)@md', 'text-sm', 'fg-text-strong'] as const

/** Sources the delivery diagram scans. */
export const deliveryFlowSources = [
  { file: 'app.tsx', code: 'className="p-lg r-xl"' },
  { file: 'page.vue', code: 'class="gap-md grid-cols(3)@md"' },
  { file: 'index.html', code: 'class="text-sm fg-text-strong"' }
] as const

/**
 * Each sample reproduces what `@master/eslint-config-css` reports for the
 * code shown; `home-content.test.ts` lints them to keep it so.
 */
export const lintRules: readonly LintRuleContent[] = [
  {
    title: 'Invalid classes',
    body: 'Classes that parse but produce invalid CSS.',
    tag: 'Error',
    file: 'button.html',
    mark: 'color:12px',
    code: `
<button class="display:inline-flex color:12px">
  Save changes
</button>
`,
    problem: {
      location: 'button.html:1:36',
      message: 'Class "color:12px" emits invalid CSS: Invalid CSS value: color:12px.',
      severity: 'error',
      source: '@master/css/no-invalid-classes'
    }
  },
  {
    title: 'Class order',
    body: 'One stable order and no duplicates, so diffs stay small.',
    tag: 'Autofix',
    file: 'card.html',
    mark: 'bg-white font-md display:flex px-md position:relative',
    fixMark: 'position:relative display:flex px-md font-md bg-white',
    code: `
<article class="bg-white font-md display:flex px-md position:relative">
  Preview card
</article>
`,
    fixPreviewCode: `
<article class="position:relative display:flex px-md font-md bg-white">
  Preview card
</article>
`,
    fix: 'Sorted the classes into the expected order.',
    problem: {
      location: 'card.html:1:17',
      message: 'Sort classes into the expected order: "position:relative display:flex px-md font-md bg-white".',
      severity: 'warning',
      source: '@master/css/sort-classes'
    }
  },
  {
    title: 'Conflicting classes',
    body: 'Two classes that set the same property in the same state.',
    tag: 'Autofix',
    file: 'settings.html',
    mark: 'm-md',
    code: `
<section class="display:grid gap-md m-md m-sm">
  Settings
</section>
`,
    fixPreviewCode: `
<section class="display:grid gap-md m-sm">
  Settings
</section>
`,
    fix: 'Removed "m-md", which "m-sm" overrides.',
    problem: {
      location: 'settings.html:1:37',
      message: 'Remove class "m-md"; it is overridden by class "m-sm" in generated CSS.',
      severity: 'warning',
      source: '@master/css/no-conflicting-classes'
    }
  },
  {
    title: 'Strict vocabulary',
    body: 'Reject classes and tokens your project manifest does not generate.',
    tag: 'Opt-in',
    file: 'upgrade.html',
    mark: 'fg-brand-tone',
    code: `
<button class="px-md fg-brand-tone">
  Upgrade plan
</button>
`,
    problem: {
      location: 'upgrade.html:1:22',
      message: 'Unknown or unsupported token for fg-: brand-tone; named tokens require a registered token, a supported sign, and a color-only opacity modifier',
      severity: 'error',
      source: '@master/css/no-invalid-classes'
    }
  },
  {
    title: 'Theme tokens',
    body: 'Require project tokens where one exists, with an allowlist for raw values.',
    tag: 'Opt-in',
    file: 'alert.html',
    mark: 'color:#dc2626',
    code: `
<p class="color:#dc2626">
  Destructive action
</p>
`,
    problem: {
      location: 'alert.html:1:11',
      message: 'Raw value "#dc2626" is not approved for class "color:#dc2626". Use a token or allow the value explicitly.',
      severity: 'warning',
      source: '@master/css/no-unapproved-raw-values'
    }
  },
  {
    title: 'Fix previews',
    body: 'Agents get fixes as a diff with a confirmation token, before any file is written.',
    tag: 'MCP',
    file: 'card.html',
    code: `
<article class="bg-white font-md display:flex px-md position:relative"> <!-- [!code --] -->
<article class="position:relative display:flex px-md font-md bg-white"> <!-- [!code ++] -->
  Preview card
`,
    problem: {
      location: 'card.html',
      message: '1 file changed. Pass the confirmToken to mastercss_apply_preview within 5 minutes.',
      severity: 'info',
      source: 'mastercss_preview_fixes'
    }
  }
]

/** Where the same lint rules run. */
export const lintSurfaces = ['ESLint', 'CLI', 'MCP server'] as const

/** The draft an agent checks, with what `@master/eslint-config-css` reports and fixes in it. */
export const agentSession = {
  file: 'plan-card.html',
  code: `
<article class="bg-surface-raised p-lg display:grid gap-md r-xl">
  <h3 class="text-xl font-medium mt-sm mt-md">Pro plan</h3>
  <p class="fg-text-muted text-sm">Unlimited projects</p>
</article>
`,
  fixedCode: `
<article class="display:grid gap-md p-lg r-xl bg-surface-raised">
  <h3 class="mt-sm text-xl font-medium">Pro plan</h3>
  <p class="text-sm fg-text-muted">Unlimited projects</p>
</article>
`,
  problems: [
    { location: 'plan-card.html:1:17', message: 'Sort classes into the expected order: "display:grid gap-md p-lg r-xl bg-surface-raised".', severity: 'warning', source: '@master/css/sort-classes' },
    { location: 'plan-card.html:2:14', message: 'Sort classes into the expected order: "mt-md mt-sm text-xl font-medium".', severity: 'warning', source: '@master/css/sort-classes' },
    { location: 'plan-card.html:2:40', message: 'Remove class "mt-md"; it is overridden by class "mt-sm" in generated CSS.', severity: 'warning', source: '@master/css/no-conflicting-classes' },
    { location: 'plan-card.html:3:13', message: 'Sort classes into the expected order: "text-sm fg-text-muted".', severity: 'warning', source: '@master/css/sort-classes' }
  ]
} satisfies { file: string, code: string, fixedCode: string, problems: HomeCodeWindowProblem[] }

export const languageServiceCards = [
  {
    title: 'Hover inspection',
    body: 'Hover a class to see the CSS it generates, including its state and query.',
    visual: 'hover-inspection'
  },
  {
    title: 'Manifest completions',
    body: 'Complete utilities, values, selectors, queries and tokens from your project manifest.',
    visual: 'manifest-aware-suggestions'
  },
  {
    title: 'Focused highlighting',
    body: 'Markup stays calm until the cursor enters a class string; then its class context lights up.',
    visual: 'active-syntax-highlighting'
  },
  {
    title: 'Color tools',
    body: 'A swatch beside every color class that resolves to one color. Edit literal colors with the native picker.',
    visual: 'color-tools'
  }
] satisfies readonly LanguageServiceCardContent[]

/** The class the hover inspection tile points at. */
export const hoverInspectionClass = 'fg-blue-60:hover@sm'

/** Markup for the hover inspection tile; the second line holds the hovered class. */
export const hoverInspectionLines = [
  '<nav class="display:flex gap-lg">',
  `  <a class="font-medium ${hoverInspectionClass}">Guide</a>`,
  '</nav>'
] as const

/**
 * Color classes the language service decorates with swatches. Tokens that switch with the
 * color scheme, such as `fg-text-amber`, have no single color and get none. The first
 * class is a literal, the kind the color picker edits in place.
 */
export const colorToolClasses = [
  { className: 'color:#4f46e5', swatchAt: 'color:'.length, color: '#4f46e5' },
  { className: 'bg-blue-60', swatchAt: 0, color: getColor('blue', 60) },
  { className: 'fg-amber-60', swatchAt: 0, color: getColor('amber', 60) },
  { className: 'b-zinc-30', swatchAt: 0, color: getColor('zinc', 30) },
  { className: 'outline-green-50', swatchAt: 0, color: getColor('green', 50) }
] as const

export const activeSyntaxHighlightingCode = `
<section class="display:grid gap-lg p-lg r-3xl bg-surface-raised">
  <h2 class="text-2xl fg-text-strong text-3xl@md">Readable classes</h2>
  <p class="clamp-lines(2) fg-text-muted">Hover a class to inspect CSS.</p>
  <button class="display:inline-flex align-items:center gap-xs fg-blue-60:hover">
    Open guide
  </button>
</section>
`

/** The completion prefix already typed before the animated token key. */
export const manifestSuggestionsPrefix = 'fg-text-'

/** The token key typed by the animation, selected from the first suggestion. */
export const manifestSuggestionsTyped = 'amber'

export const manifestSuggestionsCode = `
<button class="${manifestSuggestionsPrefix}${manifestSuggestionsTyped}">
  Upgrade plan
</button>
`

/** The first preset completions for `fg-text-`, as the language service orders them. */
export const manifestSuggestionItems = [
  { label: 'fg-text-amber', detail: '(token --color-text-amber)' },
  { label: 'fg-text-beryl' },
  { label: 'fg-text-blue' },
  { label: 'fg-text-body' },
  { label: 'fg-text-brown' },
  { label: 'fg-text-crimson' },
  { label: 'fg-text-cyan' },
  { label: 'fg-text-disabled' },
  { label: 'fg-text-fuchsia' },
  { label: 'fg-text-gray' },
  { label: 'fg-text-green' },
  { label: 'fg-text-indigo' }
] as const satisfies readonly { label: string, detail?: string }[]

export const workflowCards = {
  frameworks: {
    title: 'Framework integrations',
    body: 'Vite, Astro, Next.js, Nuxt, SvelteKit, webpack and more, on the same project manifest and rendering modes.'
  },
  impact: {
    title: 'Trace a change',
    body: 'Snapshot the project, change a token or recipe, and see the definitions, consumers and rules it touches.'
  },
  workspaces: {
    title: 'Monorepo-aware',
    body: 'Completions, hover, colors and diagnostics follow the nearest Master CSS project.'
  },
  routes: {
    title: 'Route-level styles',
    body: 'Route stylesheets use shared tokens, mixins and custom media without copying global rules.'
  }
} satisfies Record<string, WorkflowCardContent>

/** Project tools from the Master CSS MCP server, in the order an agent typically calls them. */
export const mcpTools = [
  { name: 'mastercss_scan_project', body: 'Scan sources and stylesheet entries' },
  { name: 'mastercss_manifest_query', body: 'Look up tokens, utilities, mixins and media' },
  { name: 'mastercss_inspect_class', body: 'Show the rules and CSS behind a class' },
  { name: 'mastercss_trace_class', body: 'Follow a class from source to output' },
  { name: 'mastercss_render_css', body: 'Render CSS for markup or a class list' },
  { name: 'mastercss_lint_project', body: 'Lint classes and propose fixes' },
  { name: 'mastercss_css_compare', body: 'Compare output before and after a change' },
  { name: 'mastercss_preview_fixes', body: 'Return fixes as a diff with a token' },
  { name: 'mastercss_apply_preview', body: 'Apply a confirmed preview' }
] satisfies readonly McpToolContent[]

export const mcpCommand = 'npx -y @master/css-mcp@rc --root /path/to/project'

export const impactCommand = 'npx @master/css-cli inspect --compare before.json'
