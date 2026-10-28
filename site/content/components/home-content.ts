import colorNames from '~/site/docs-shell/data/color-names'
import { COLOR_LEVELS } from '~/site/docs-shell/data/color-palette'

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

export interface DeliveryModeContent {
  id: DeliveryModeId
  title: string
  body: string
  href: string
  default?: boolean
}

export interface LintRuleContent {
  title: string
  file: string
  code: string
  /** The text the problem points at, underlined in the sample. */
  mark?: string
  /** The source after the fix the rule offers. */
  fixPreviewCode?: string
  problem: HomeCodeWindowProblem
}

export interface WorkflowCardContent {
  title: string
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

/** Real classes, linted by the tests, that the MCP floor is written in. */
export const ctaClassRows = [
  ['display:grid', 'gap-lg', 'grid-cols(3)@md', 'p-xl', 'r-3xl', 'bg-surface-raised', 'shadow-lg', 'fg-text-strong'],
  ['text-2xl', 'font-semibold', 'tracking-tight', 'fg-blue-60:hover', 'outline-width:2px:focus-visible', 'transition-normal', 'opacity:0@starting-style'],
  ['container-type:inline-size', 'display:none@media(print)', 'bg-blue-60/0.2', '-mt-sm', 'clamp-lines(2)', 'fg-text-muted', 'r-pill', 'px-lg']
] as const

/** Rows of class text for the floor of the MCP figure: the project the server reads. */
export const glyphFieldLines = ctaClassRows.map((row) => `${row.join('   ')}   `)

export const themeVariablesCode = `@theme {
  --font-family-sans: "Inter";

  --spacing-md: 1rem;   /* p-md */
  --spacing-lg: 1.5rem; /* p-lg */
  --radius-xl: 0.75rem; /* r-xl */

  /* bg-surface-base */
  --color-surface-base: light-dark(
    var(--color-zinc-0),
    var(--color-zinc-95)
  );
}
`

/** The preset layer order, bottom to top. */
export const cascadeLayers = [
  { name: 'theme' },
  { name: 'base' },
  { name: 'defaults' },
  { name: 'components' },
  { name: 'utilities' }
] as const

export const p3PaletteColorNames = [...colorNames].reverse()

export const p3PaletteTiers = [...COLOR_LEVELS].reverse()

/** Paired half-width cards: themes first and primitives last, with the full-width palette between them. */
export const designSystemTiles = [
  {
    title: 'Light and dark, same markup',
    body: 'Modes swap token values, not class names. Drag the divider to see which value is in use.',
    gridColumnClassName: 'grid-col-span(4)@md',
    visual: 'theme-modes'
  },
  {
    title: 'Tokens, defined once',
    body: 'Define color, spacing, radius and type once in @theme; utilities, components and modes all read from them.',
    gridColumnClassName: 'grid-col-span(4)@md',
    visual: 'theme-variables'
  },
  {
    title: 'Layout and motion, together',
    body: 'Grid spans, responsive layouts, animation and view transitions, written right beside the markup they style.',
    gridColumnClassName: 'grid-col-span(5)@md',
    visual: 'art-gallery'
  },
  {
    title: 'Native CSS layers',
    body: 'Utilities sit in a later layer than components, so a class in markup wins without !important.',
    gridColumnClassName: 'grid-col-span(3)@md',
    visual: 'cascade-layers'
  }
] satisfies readonly DesignSystemTileContent[]

/** The full-width P3 palette sits between the two pairs of cards. */
export const designSystemPalette = {
  title: 'Wide-gamut color',
  body: 'P3 palettes on a predictable tier scale, from deep anchors to bright accents beyond sRGB.'
}

export const deliveryModes = [
  {
    id: 'static',
    title: 'Static rendering',
    body: 'Scan classes at build time and ship a plain stylesheet, with no runtime in the browser.',
    href: '/guide/rendering-modes#static-rendering',
    default: true
  },
  {
    id: 'progressive',
    title: 'Progressive rendering',
    body: 'Render first-load CSS into the page; the runtime starts its engine only for classes outside it.',
    href: '/guide/rendering-modes#progressive-rendering'
  },
  {
    id: 'runtime',
    title: 'Runtime rendering',
    body: 'Generate rules in the browser as classes appear, from editors, CMS content or playgrounds.',
    href: '/guide/rendering-modes#runtime-rendering'
  }
] satisfies readonly DeliveryModeContent[]

/**
 * Each sample reproduces what `@master/eslint-config-css` reports for the
 * code shown; `home-content.test.ts` lints them to keep it so.
 */
export const lintRules: readonly LintRuleContent[] = [
  {
    title: 'Invalid classes',
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
    file: 'card.html',
    mark: 'bg-white font-md display:flex px-md position:relative',
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
    problem: {
      location: 'card.html:1:17',
      message: 'Sort classes into the expected order: "position:relative display:flex px-md font-md bg-white".',
      severity: 'warning',
      source: '@master/css/sort-classes'
    }
  },
  {
    title: 'Conflicting classes',
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
    problem: {
      location: 'settings.html:1:37',
      message: 'Remove class "m-md"; it is overridden by class "m-sm" in generated CSS.',
      severity: 'warning',
      source: '@master/css/no-conflicting-classes'
    }
  },
  {
    title: 'Strict vocabulary',
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

export const workflowCards = {
  frameworks: {
    title: 'Framework integrations',
    body: 'Every framework integration and the CLI load the same project manifest, so builds and editors agree.'
  },
  impact: {
    title: 'Trace a change',
    body: 'Change a token and compare snapshots to see the classes, files and outputs it reaches.'
  },
  workspaces: {
    title: 'Monorepo-aware',
    body: 'Each file follows its nearest project, so one class can resolve differently per app.'
  },
  routes: {
    title: 'Route-level styles',
    body: 'Route stylesheets use shared tokens, mixins and custom media without copying global rules.'
  }
} satisfies Record<string, WorkflowCardContent>
