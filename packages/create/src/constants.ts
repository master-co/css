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
  svelteAddon: '@master/css-svelte-addon',
  webpack: '@master/css-webpack',
  eslintConfig: '@master/eslint-config-css',
  mcp: '@master/css-mcp'
} as const

export const CANONICAL_ESLINT_CONFIG = `import masterCSS from '@master/eslint-config-css'

export default masterCSS
`

export const AGENT_RULES_BLOCK = `## Master CSS

- Use https://rc.css.master.co as the source of truth.
- Inspect the framework, package manager, CSS entry, rendering mode, theme tokens, component classes, utilities, custom variants, and validation commands before editing styles.
- Prefer existing @theme tokens, @components, @utilities, and @custom-variant definitions.
- Use named tokens with hyphens and native values with colons; write complete native queries and define mode activation with @mode.
- Use static rendering by default, explicit CSS variables for dynamic values, and enable native pruning only when intended.
- Use the Master CSS MCP server with project context when available. A manifest load failure is an error, never permission to switch to the preset.
- Distinguish matching, CSS value validity, and browser support; preserve unknown native CSS and report known invalid values.
- Use ESLint for class policy diagnostics and the Master CSS Language Service for completion, hover, colors, highlighting, and directive formatting.
- Do not invent Master CSS APIs, directives, package names, or Tailwind-style syntax.
- Preserve semantic HTML, accessibility attributes, and behavior.
`
