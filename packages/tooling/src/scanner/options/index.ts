import type { MasterCSSManifest } from '@master/css-schema/manifest'

const defaultExclude = Object.freeze([
  '**/*.css',
  '**/*.d.ts',
  '**/*.test.*',
  '**/*test.{js,cjs,ts}',
  '**/*README.md',
  '**/dist/**',
  '**/out/**',
  '**/public/**',
  '**/.git/**',
  '**/.hg/**',
  '**/.svn/**',
  '**/.cache/**',
  '**/.vite/**',
  '**/.turbo/**',
  '**/.parcel-cache/**',
  '**/.nx/cache/**',
  '**/.astro/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/.svelte-kit/**',
  '**/.vitepress/cache/**',
  '**/.vitepress/dist/**',
  '**/.docusaurus/**',
  '**/.output/**',
  '**/.vercel/**',
  '**/.netlify/**',
  '**/.wrangler/**',
  '**/.serverless/**',
  '**/.yarn/**',
  '**/.pnpm-store/**',
  '**/.npm/**',
  '**/.bun/**',
  '**/node_modules/webpack*/**',
  '**/node_modules/events/**',
  '**/node_modules/html-entities/**',
  '**/node_modules/ansi-html-community/**',
  '**/node_modules/util/**',
  '**/node_modules/react/**',
  '**/node_modules/react-dom/**',
  '**/node_modules/vue/**',
  '**/node_modules/next/**',
  '**/node_modules/astro/**',
  '**/node_modules/svelte/**',
  '**/node_modules/svelte-hmr/**',
  '**/node_modules/@swc/**',
  '**/node_modules/@sveltejs/**',
  '**/node_modules/@angular/**'
])

export interface MasterCSSScannerConfiguration {
  verbose?: number
  path?: string
  exclude?: readonly string[]
  safelist?: readonly string[]
  blocklist?: readonly (string | RegExp)[]
}

export interface MasterCSSScannerOptions extends MasterCSSScannerConfiguration {
  manifest: MasterCSSManifest
}

export const defaultScannerOptions: Readonly<MasterCSSScannerConfiguration> =
  Object.freeze({
    verbose: 1,
    exclude: defaultExclude,
    safelist: Object.freeze([]),
    blocklist: Object.freeze([])
  })
