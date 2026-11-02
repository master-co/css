import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'
import astro from 'eslint-plugin-astro'
import svelte from 'eslint-plugin-svelte'
import tsParser from '@typescript-eslint/parser'
import * as mdx from 'eslint-mdx'

const typescriptConfig = {
  files: ['**/*.ts'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      sourceType: 'module'
    }
  }
}

const svelteConfig = {
  files: ['**/*.svelte', '**/*.svelte.ts'],
  languageOptions: {
    parserOptions: {
      parser: tsParser
    }
  },
  rules: {
    // Site links localize their own pathnames; see docs-shell/components/Link.svelte.
    'svelte/no-navigation-without-resolve': 'off',
    // Highlighted code and inline SVG markup are trusted build output.
    'svelte/no-at-html-tags': 'off',
    'svelte/require-each-key': 'off',
    // Module caches and DOM bookkeeping (Set/Map/Date) are deliberately not reactive.
    'svelte/prefer-svelte-reactivity': 'off',
    // Code figures spell literal braces, newlines and kept spaces as `{'{'}`, `{'\n'}` and `{' '}`.
    'svelte/no-useless-mustaches': 'off'
  }
}

// Route modules publish `metadata`, `generateMetadata`, `bodyClass` and `bare` from their frontmatter; see routes.ts.
const routeConfig = {
  files: ['content/**/page.astro', 'content/**/_page.astro', 'sections/*.astro'],
  rules: {
    'astro/no-exports-from-components': 'off'
  }
}

const projectConfig = {
  rules: {
    'import/no-anonymous-default-export': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off'
  },
}

// Site UI uses tokens; a raw native value must be a deliberate, reviewed exception. An element that
// styles many others through combinators has become a component and belongs in @layer components.
const masterCSSPolicyConfig = {
  rules: {
    '@master/css/no-unapproved-raw-values': 'warn',
    '@master/css/prefer-component-classes': 'warn'
  }
}

const configs = [
  ...astro.configs.recommended,
  ...svelte.configs['flat/recommended'],
  typescriptConfig,
  svelteConfig,
  routeConfig,
  projectConfig,
  ...css,
  masterCSSPolicyConfig
]

const mdxDisabledRules = Object.fromEntries(configs
  .flatMap((config) => Object.keys(config.rules || {}))
  .filter((rule) => !rule.startsWith('@master/css/'))
  .map((rule) => [rule, 'off']))

// Reviewed geometry has no shared design-token meaning. Keep exceptions file-local and exact;
// new raw values still produce diagnostics. Common spacing, weight and duration use tokens above.
const reviewedGeometry = [
  // Minimum readable token table column; retain rem scaling.
  { files: ["components/ThemeNumberVariableTable.astro"], values: ["12rem"] },
  // Same readable column as the token table.
  { files: ["components/demo/DemoTokenTable.astro"], values: ["12rem"] },
  // Center the timeline marker on its measured percentage.
  { files: ["components/demo/DemoWaterfall.astro"], values: ["-50%"] },
  // Controlled comparison geometry for layout, clipping and shadow specimens.
  { files: ["components/demo/foundations/FoundationAxes.astro", "components/demo/foundations/FoundationMedia.astro", "components/demo/foundations/FoundationRadius.astro", "components/demo/foundations/FoundationShrink.astro"], values: ["2.5rem", "3.5rem", "5rem", "9rem"] },
  // Measured chart bars use a compact rem-scaled thickness.
  { files: ["content/components/BenchmarkSizeChart.svelte"], values: ["1.25rem"] },
  // Large-screen handbook preview boundary.
  { files: ["content/components/DesignSystemSection.astro"], values: ["30rem"] },
  // Matched shopping artboards; icon badge geometry and compact display rhythm.
  { files: ["content/components/ThemeModesPreview.svelte"], values: ["-0.125rem", "0.4375rem", "1.1", "1.75rem", "5rem"] },
  // The standalone layout fills the dynamic viewport.
  { files: ["content/examples/layout-system/page.astro"], values: ["100dvh"] },
  // Popover stays within its own viewport.
  { files: ["content/guide/conditional-queries/components/StartingStyleExample.astro"], values: ["90vw"] },
  // Native animation and fluid type demonstration.
  { files: ["content/guide/style-declarations/components/Overview.astro"], values: ["3s", "7vw"] },
  // Unfinished marker scales relative to the surrounding link.
  { files: ["docs-shell/components/Link.svelte"], values: [".5em"] },
  // Localized duplicate title spacing scales with the title.
  { files: ["docs-shell/components/OverviewButtons.astro"], values: [".25em"] },
].map(({ files, values }) => ({
  files,
  rules: { '@master/css/no-unapproved-raw-values': ['warn', {
    allowedPatterns: values.map(value => `^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  }] }
}))

export default defineConfig([
  ...configs,
  ...reviewedGeometry,
  {
    files: ['**/*.mdx'],
    languageOptions: {
      parser: mdx
    },
    rules: mdxDisabledRules
  }
])
