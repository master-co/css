import { defineConfig } from 'eslint/config'
import css from '@master/eslint-config-css'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tsParser from '@typescript-eslint/parser'
import * as mdx from 'eslint-mdx'

const reactHooksConfig = {
  plugins: {
    'react-hooks': reactHooks
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  }
}

const typescriptConfig = {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      },
      sourceType: 'module'
    }
  }
}

const projectConfig = {
  settings: {
    react: {
      version: '19.2.5'
    }
  },
  rules: {
    'import/no-anonymous-default-export': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-indexed-object-style': 'off',
    'react/display-name': 'off',
    'react/react-in-jsx-scope': 'off'
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
  react.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  reactHooksConfig,
  typescriptConfig,
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
  { files: ["components/ThemeNumberVariableTable.tsx"], values: ["12rem"] },
  // Same readable column as the token table.
  { files: ["components/demo/DemoTokenTable.tsx"], values: ["12rem"] },
  // Center the timeline marker on its measured percentage.
  { files: ["components/demo/DemoWaterfall.tsx"], values: ["-50%"] },
  // Controlled comparison geometry for layout, clipping and shadow specimens.
  { files: ["components/demo/FoundationExamples.tsx"], values: ["2.5rem", "3.5rem", "5rem", "9rem"] },
  // Scrollable minimum width of the delivery comparison.
  { files: ["content/blog/bootstrapping-master-css-with-vite/content.mdx"], values: ["40rem"] },
  // Measured chart bars use a compact rem-scaled thickness.
  { files: ["content/components/BenchmarkSizeChart.tsx"], values: ["1.25rem"] },
  // Large-screen handbook preview boundary.
  { files: ["content/components/DesignSystemSection.tsx"], values: ["30rem"] },
  // Matched shopping artboards; icon badge geometry and compact display rhythm.
  { files: ["content/components/ThemeModesPreview.tsx"], values: ["-0.125rem", "0.4375rem", "1.1", "1.75rem", "5rem"] },
  // Concentric-radius specimen boundary.
  { files: ["content/design-system/components/Showcase.tsx"], values: ["22rem"] },
  // Space reserved for the coordinate annotation and its leaders.
  { files: ["content/design-system/review/axes/AnnotationComposition.tsx"], values: ["22rem", "9rem"] },
  // Contain the annotation specimen at its reviewed width.
  { files: ["content/design-system/review/axes/page.tsx"], values: ["26rem"] },
  // Matched specimen widths for items and their context.
  { files: ["content/design-system/review/item/page.tsx"], values: ["22rem", "34rem"] },
  // Explicit image width in the aspect-ratio specimen.
  { files: ["content/design-system/review/media/page.tsx"], values: ["7rem"] },
  // Slow linear timeline makes playback controls observable.
  { files: ["content/design-system/review/motion/page.tsx"], values: ["2s", "linear"] },
  // Fixed scroll viewport demonstrates overflow.
  { files: ["content/design-system/review/scroll/page.tsx"], values: ["12rem"] },
  // Same specimen boundary as the concentric-radius showcase.
  { files: ["content/design-system/review/surface/page.tsx"], values: ["22rem"] },
  // The standalone layout fills the dynamic viewport.
  { files: ["content/examples/layout-system/page.tsx"], values: ["100dvh"] },
  // Popover stays within its own viewport.
  { files: ["content/guide/conditional-queries/components/StartingStyleExample.tsx"], values: ["90vw"] },
  // Native animation and fluid type demonstration.
  { files: ["content/guide/style-declarations/components/Overview.tsx"], values: ["3s", "7vw"] },
  // Unfinished marker scales relative to the surrounding link.
  { files: ["docs-shell/components/Link.tsx"], values: [".5em"] },
  // Localized duplicate title spacing scales with the title.
  { files: ["docs-shell/components/OverviewButtons.tsx"], values: [".25em"] },
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
