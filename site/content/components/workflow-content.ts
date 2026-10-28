/**
 * Samples for the homepage's Workflow section. Each figure draws from these, and
 * `home-content.test.ts` checks them against the packages, guides, compiler and language service.
 */

/** The guide each Workflow card's "See details" link opens; tests check every page and heading exists. */
export const workflowGuides = {
  frameworks: '/guide/installation/integrations',
  workspaces: '/guide/monorepo',
  routes: '/guide/route-level-styles',
  impact: '/guide/ai-coding#review-the-second-change'
} as const

/** Build integrations, in the order the stage lays them out. Every one is a published package. */
export const workflowIntegrations = [
  { key: 'vite', name: '@master/css-vite' },
  { key: 'webpack', name: '@master/css-webpack' },
  { key: 'next', name: '@master/css-next' },
  { key: 'nuxt', name: '@master/css-nuxt' },
  { key: 'astro', name: '@master/css-astro' },
  { key: 'svelte', name: '@master/css-svelte' },
  { key: 'cli', name: '@master/css-cli' }
] as const

export type WorkflowIntegrationKey = typeof workflowIntegrations[number]['key']

/**
 * Frameworks on the stage, each with the integration its installer or installation guide sets up,
 * and the installation guide it links to (`/guide/installation/<guide>`).
 */
export const workflowFrameworks = [
  { brand: 'vite', guide: 'vite', integration: 'vite' },
  { brand: 'react', guide: 'react', integration: 'vite' },
  { brand: 'vuejs', guide: 'vuejs', integration: 'vite' },
  { brand: 'react-router', guide: 'react-router', integration: 'vite' },
  { brand: 'laravel', guide: 'laravel', integration: 'vite' },
  { brand: 'rails', guide: 'rails', integration: 'vite' },
  { brand: 'lit', guide: 'lit', integration: 'vite' },
  { brand: 'storybook', guide: 'storybook', integration: 'vite' },
  { brand: 'webpack', guide: 'webpack', integration: 'webpack' },
  { brand: 'rspack', guide: 'rspack', integration: 'webpack' },
  { brand: 'rsbuild', guide: 'rsbuild', integration: 'webpack' },
  { brand: 'nextjs', guide: 'nextjs', integration: 'next' },
  { brand: 'nuxtjs', guide: 'nuxtjs', integration: 'nuxt' },
  { brand: 'astro', guide: 'astro', integration: 'astro' },
  { brand: 'svelte', guide: 'svelte', integration: 'svelte' },
  { brand: 'angular', guide: 'angular', integration: 'cli' }
] as const satisfies readonly { brand: string, guide: string, integration: WorkflowIntegrationKey }[]

/** The class both monorepo apps use; each app's own manifest decides what it resolves to. */
export const workflowProjectClass = 'bg-primary'

/** Two apps from the Monorepo guide, each with its own CSS entry and its own `--color-primary`. */
export const workflowProjects = [
  { directory: 'projects/admin', file: 'Header.tsx', primary: '#4f46e5' },
  { directory: 'projects/shop', file: 'Cart.tsx', primary: '#0d9488' }
] as const

/** The project's own definitions that the route stylesheets below use beside the preset's. */
export const workflowRouteProjectCSS = `@mixin --raised {
  border-radius: var(--radius-xl);
  background-color: var(--color-surface-raised);
  box-shadow: var(--shadow-sm);
}
`

/** Project definitions on the route figure's floor, by the directive that declares them. */
export const workflowRouteDefinitions = [
  { directive: '@theme', name: '--spacing-5xl' },
  { directive: '@theme', name: '--spacing-lg' },
  { directive: '@mixin', name: '--raised' },
  { directive: '@custom-media', name: '--md' }
] as const

/** Route stylesheets, one per route. Each uses project definitions and keeps its own output. */
export const workflowRoutes = [
  {
    route: '/',
    code: `.hero {
  display: grid;
  gap: var(--spacing-5xl);
  @media (--md) {
    grid-auto-flow: column;
  }
}`
  },
  {
    route: '/pricing',
    code: `.plan {
  padding: var(--spacing-lg);
  @apply --raised;
  @media (--md) {
    padding: var(--spacing-5xl);
  }
}`
  },
  {
    route: '/blog',
    code: `.post {
  max-width: 42rem;
  padding: var(--spacing-lg);
  @media (--md) {
    @apply --raised;
  }
}`
  }
] as const

/** The definition names a route stylesheet references: `var(--…)`, `@apply --…` and `(--…)` media. */
export function workflowRouteReferences(code: string) {
  return [...new Set([...code.matchAll(/var\((--[\w-]+)\)|@apply (--[\w-]+)|@media \((--[\w-]+)\)/g)].map((match) => match[1] ?? match[2] ?? match[3]))]
}

/** The token change the impact graph traces, with the value before and after. */
export const workflowTraceChange = { token: '--color-brand', before: '#4f46e5', after: '#0ea5e9' } as const

/**
 * Impact graph nodes as [column, label, kind, wide row %, narrow x %]. Each kind is one column of an
 * `inspect --compare` report (definitions, classes, files, outputs). Wide cards read the columns left
 * to right; narrow cards stack them.
 */
export const workflowTraceNodes = [
  [0, '--color-brand', 'definition', 50, 50],
  [1, 'bg-brand', 'class', 30, 27],
  [1, 'fg-brand', 'class', 70, 73],
  [2, 'Button.tsx', 'file', 16, 21],
  [2, 'Badge.tsx', 'file', 50, 50],
  [2, 'pricing.html', 'file', 84, 79],
  [3, 'app.css', 'output', 50, 50]
] as const

export const workflowTraceEdges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [5, 6]] as const
