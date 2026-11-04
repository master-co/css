import { readFileSync } from 'node:fs'

const packageJSON = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version?: string }
export const MASTER_CSS_VERSION = packageJSON.version || 'rc'

export const MASTER_CSS_PACKAGES = {
  css: '@master/css',
  runtime: '@master/css-runtime',
  preset: '@master/css-preset',
  cli: '@master/css-cli',
  vite: '@master/css-vite',
  next: '@master/css-next',
  nuxt: '@master/css-nuxt',
  astro: '@master/css-astro',
  svelte: '@master/css-svelte',
  svelteAddon: '@master/css-svelte-addon',
  webpack: '@master/css-webpack',
  eslintConfig: '@master/eslint-config-css',
  mcp: '@master/css-mcp'
} as const

export const CANONICAL_ESLINT_CONFIG = `import masterCSS from '@master/eslint-config-css'

export default masterCSS
`

export const AGENT_RULES_BLOCK = `## Master CSS

- Read installed Master CSS versions and the active manifest before choosing matching documentation; the preview documentation is https://rc.css.master.co.
- Use the official master-css skill for UI work. Install it for your chosen agent with: npx skills add master-co/css --skill master-css. Check its compatibility with the installed project version.
- Inspect the framework, package manager, CSS entry, rendering mode, theme tokens, component classes, mixins, custom media, and validation commands before editing styles.
- Prefer existing @theme tokens and native CSS in @layer defaults or @layer components. Use @utility for on-demand classes and @mixin for CSS reuse and native property names for direct declarations. Write native declarations and selectors in stylesheets.
- Use fixed utilities such as flex and items-center, direct-value utilities such as p(16), named tokens such as bg-brand, and parenthesized native declarations such as (gap:1rem). Query the active manifest rather than guessing token values.
- Reuse selector and conditional wrappers with @mixin, @contents and @apply; classes use @apply(--name(...)). Keep wrapper suffixes in their authored nesting order. Choose a class layer with @layer(base|defaults|components|utilities), and use outer @layer blocks in CSS.
- Use static rendering by default, explicit CSS variables for dynamic values, and enable native pruning only when intended.
- Use the Master CSS MCP server with project context when available. A manifest load failure is an error, never permission to switch to the preset.
- When available, mastercss_suggest_classes proposes classes for isolated CSS declaration blocks. Preserve its remainingCss and review cascade changes; generated CSS alone does not verify browser rendering.
- Distinguish matching, CSS value validity, and browser support; preserve unknown native CSS and report known invalid values.
- Use ESLint for class policy diagnostics and the Master CSS Language Service for completion, hover, colors, highlighting, and directive formatting.
- Do not invent Master CSS APIs, directives, package names, or Tailwind-style syntax.
- Preserve semantic HTML, accessibility attributes, and behavior.
`
