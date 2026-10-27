import colorNames from '~/site/docs-shell/data/color-names'
import { COLOR_LEVELS } from '~/site/docs-shell/data/color-palette'

export type DeliveryModeIconId = 'bolt' | 'fileCode' | 'stack'

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
  visual: 'theme-modes' | 'theme-variables' | 'art-gallery' | 'native-css-primitives'
}

export interface DesignSystemRowContent {
  title: string
  gridClassName: string
  tiles?: readonly DesignSystemTileContent[]
  body?: string
  visual?: 'p3-palette'
}

export interface DeliveryModeContent {
  title: string
  body: string
  href: string
  icon: DeliveryModeIconId
  accentClassName: string
  signal: string
}

export interface AgentDiagnosticCardContent {
  title: string
  body: string
  code: string
  /** Rendered while the card is hovered: the source after an autofix. */
  fixPreviewCode?: string
  problem: HomeCodeWindowProblem
  problemsLabel: 'Problems' | 'Preview'
}

export interface LanguageServiceCardContent {
  title: string
  body: string
  visual: 'active-syntax-highlighting' | 'manifest-aware-suggestions'
}

export interface DevelopmentWorkflowCardContent {
  title: string
  body: string
  signal: string
}

export const homeSections = {
  hero: 'hero',
  designSystem: 'design-system',
  cssCost: 'css-cost',
  codeDiagnostics: 'code-diagnostics',
  languageService: 'language-service',
  developmentWorkflow: 'development-workflow',
  deliveryModes: 'delivery-modes',
  getStarted: 'get-started'
} as const

export const heroExampleCode = `
<article class="display:grid gap-lg p-lg r-3xl bg-surface-raised">
  <p class="fg-text-muted">Design system surface</p>
  <h2 class="text-2xl fg-text-strong">Agent-ready UI</h2>
  <button class="py-sm px-md r-xl bg-yellow fg-yellow-95">
    Ship interface
  </button>
</article>
`

export const themeVariablesCode = `@theme {
  --font-family-sans: "Inter", sans-serif; /* font-sans */

  --spacing-md: 1rem;   /* p-md */
  --spacing-lg: 1.5rem; /* p-lg */
  --radius-xl: 0.75rem; /* r-xl */

  /* bg-surface-base, in light and dark */
  --color-surface-base: light-dark(
    var(--color-neutral-0),
    var(--color-gray-95)
  );
}
`

export const nativeCssPrimitivesCode = `@import '@master/css';

@mixin --control {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  border-radius: var(--radius-lg);
}

@layer components {
  .btn {
    @apply --control;
    height: 2.5rem;
    padding-inline: var(--spacing-md);
    color: white;
    background: var(--color-blue-60);

    &:hover {
      background: var(--color-blue-70);
    }

    @media (--dark) {
      background: var(--color-blue-50);
    }
  }
}
`

export const p3PaletteColorNames = [...colorNames].reverse()

export const p3PaletteTiers = [...COLOR_LEVELS].reverse()

export const designSystemRows = [
  {
    title: 'Tokenized themes',
    gridClassName: 'grid-cols(1) grid-cols(2)@md',
    tiles: [
      {
        title: 'Theme modes without forks',
        body: 'Switch light, dark, and custom modes through the same tokens while components keep their markup.',
        visual: 'theme-modes'
      },
      {
        title: 'System-wide variables',
        body: 'Define color, spacing, radius, and type once, then reuse them across utilities, components, and modes.',
        visual: 'theme-variables'
      }
    ]
  },
  {
    title: 'Wide-gamut color system',
    body: 'Use vivid P3 palettes with a predictable tier scale, from deep anchors to bright interface accents.',
    gridClassName: 'grid-cols(1)',
    visual: 'p3-palette'
  },
  {
    title: 'Modern CSS primitives',
    gridClassName: 'grid-cols(1) grid-cols(3)@md',
    tiles: [
      {
        title: 'Layout and motion, together',
        body: 'Compose CSS Grid, responsive spans, animations, and View Transition selectors right beside the UI.',
        gridColumnClassName: 'grid-col-span(2)@md',
        visual: 'art-gallery'
      },
      {
        title: 'Reusable native CSS',
        body: 'Package declarations, nested selectors, mixins, and condition blocks into compact component classes.',
        visual: 'native-css-primitives'
      }
    ]
  }
] satisfies readonly DesignSystemRowContent[]

export const deliveryModes = [
  {
    title: 'Runtime rendering',
    body: 'Generate rules from live DOM changes while teams keep moving.',
    href: '/guide/rendering-modes#runtime-rendering',
    icon: 'bolt',
    accentClassName: 'bg-yellow',
    signal: 'Live DOM'
  },
  {
    title: 'Static rendering',
    body: 'Scan source once and ship a compact CSS file with production builds.',
    href: '/guide/rendering-modes#static-rendering',
    icon: 'fileCode',
    accentClassName: 'bg-blue',
    signal: 'Build CSS'
  },
  {
    title: 'Progressive rendering',
    body: 'Render first-response CSS, then let runtime hydration adopt late UI states.',
    href: '/guide/rendering-modes#progressive-rendering',
    icon: 'stack',
    accentClassName: 'bg-red',
    signal: 'Hybrid'
  }
] satisfies readonly DeliveryModeContent[]

/**
 * Each sample reproduces what `@master/eslint-config-css` reports for the
 * code shown; `site/utils/home-content.test.ts` lints them to keep it so.
 */
export const agentDiagnosticCards = [
  {
    title: 'Invalid classes',
    body: 'Catch classes that match Master CSS syntax but generate invalid CSS before they reach the browser.',
    code: `
<button class="display:inline-flex color:12px">
  Save changes
</button>
`,
    problem: {
      location: 'home.html:1:36',
      message: 'Class "color:12px" emits invalid CSS: Invalid CSS value: color:12px.',
      severity: 'error',
      source: '@master/css/no-invalid-classes'
    },
    problemsLabel: 'Problems'
  },
  {
    title: 'Class order',
    body: 'Sort class strings into stable generated-rule order and remove duplicates so diffs stay reviewable.',
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
      location: 'home.html:1:17',
      message: 'Sort classes into the expected order: "position:relative display:flex px-md font-md bg-white".',
      severity: 'warning',
      source: '@master/css/sort-classes'
    },
    problemsLabel: 'Problems'
  },
  {
    title: 'Conflicting classes',
    body: 'Find classes that emit the same declarations in the same variant scope, decided by generated CSS order.',
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
      location: 'home.html:1:37',
      message: 'Remove class "m-md"; it is overridden by class "m-sm" in generated CSS.',
      severity: 'warning',
      source: '@master/css/no-conflicting-classes'
    },
    problemsLabel: 'Problems'
  },
  {
    title: 'Strict vocabulary',
    body: 'Opt in to reject classes and token keys that the active project manifest does not generate.',
    code: `
<button class="px-md fg-brand-tone">
  Upgrade plan
</button>
`,
    problem: {
      location: 'home.html:1:22',
      message: 'Unknown or unsupported token for fg-: brand-tone; named tokens require a registered token, a supported sign, and a color-only opacity modifier',
      severity: 'error',
      source: '@master/css/no-invalid-classes'
    },
    problemsLabel: 'Problems'
  },
  {
    title: 'Theme tokens',
    body: 'Enforce an opt-in raw value policy so token-backed properties use project tokens unless a value is allowed.',
    code: `
<p class="color:#dc2626">
  Destructive action
</p>
`,
    problem: {
      location: 'home.html:1:11',
      message: 'Raw value "#dc2626" is not approved for class "color:#dc2626". Use a token or allow the value explicitly.',
      severity: 'warning',
      source: '@master/css/no-unapproved-raw-values'
    },
    problemsLabel: 'Problems'
  },
  {
    title: 'Safe fix preview',
    body: 'Return lint fixes as a reviewable diff with a confirmation token before an agent writes to the workspace.',
    code: `
<article class="bg-white font-md display:flex px-md position:relative"> <!-- [!code --] -->
<article class="position:relative display:flex px-md font-md bg-white"> <!-- [!code ++] -->
  Preview card
`,
    problem: {
      location: 'home.html',
      message: 'Preview created for review.',
      severity: 'info',
      source: 'mastercss_preview_fixes'
    },
    problemsLabel: 'Preview'
  }
] satisfies readonly AgentDiagnosticCardContent[]

export const languageServiceCards = [
  {
    title: 'Manifest-aware suggestions',
    body: 'Complete utilities, values, selectors, queries, directives, and project tokens from the active workspace manifest.',
    visual: 'manifest-aware-suggestions'
  },
  {
    title: 'Active syntax highlighting',
    body: 'Highlight the current class context by default so dense markup stays calm until a human is reading it.',
    visual: 'active-syntax-highlighting'
  }
] satisfies readonly LanguageServiceCardContent[]

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

export const developmentWorkflowCards = [
  {
    title: 'Workspace-aware manifests',
    body: 'Keep monorepo completions, colors, hover previews, and directive diagnostics aligned with the nearest Master CSS project.',
    signal: 'Nearest manifest'
  },
  {
    title: 'Build-tool mode integration',
    body: 'Share the same manifest and rendering mode across Vite, Astro, Next.js, webpack, and CLI builds without changing authoring syntax.',
    signal: 'Toolchain mode'
  },
  {
    title: 'Route-level styles',
    body: 'Load native route stylesheets with shared project tokens, mixins, and custom media, without copying global rules into each page.',
    signal: 'Route boundary'
  },
  {
    title: 'Project policy feedback',
    body: 'Carry raw value policy, diagnostics, and fix previews into editors, ESLint, and MCP automation from one workspace source.',
    signal: 'Shared policy'
  }
] satisfies readonly DevelopmentWorkflowCardContent[]
