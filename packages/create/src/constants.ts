export const MASTER_CSS_VERSION = 'rc'

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
  svelteAddon: '@master/css-sv',
  webpack: '@master/css-webpack',
  eslintConfig: '@master/eslint-config-css',
  mcp: '@master/css-mcp'
} as const

export const CANONICAL_ESLINT_CONFIG = `import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'

export default defineConfig([
  ...css
])
`

export const AGENT_RULES_BLOCK = `## Master CSS

- Use https://rc.css.master.co as the source of truth.
- Inspect the framework, package manager, CSS entry, rendering mode, theme tokens, component classes, utilities, custom variants, and validation commands before editing styles.
- Prefer existing @theme tokens, @components, @utilities, and @custom-variant definitions.
- Use the Master CSS MCP server when available.
- Use ESLint for class policy diagnostics and the Master CSS Language Service for completion, hover, colors, highlighting, and directive formatting.
- Do not invent Master CSS APIs, directives, package names, or Tailwind-style syntax.
- Preserve semantic HTML, accessibility attributes, and behavior.
`
