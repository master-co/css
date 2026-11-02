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

export default defineConfig([
  ...configs,
  {
    files: ['**/*.mdx'],
    languageOptions: {
      parser: mdx
    },
    rules: mdxDisabledRules
  }
])
