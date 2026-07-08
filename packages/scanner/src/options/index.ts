import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { SourceAdapter } from '@master/css-source'

const scannerOptions: ScannerOptions = {
    // enable verbose Logs
    verbose: 1,
    // specify a compiled Master CSS manifest override
    manifest: undefined,
    // specify module sources to exclude
    exclude: [
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
        '**/node_modules/@angular/**',
    ],
    safelist: [],
    blocklist: [],
    adapters: [],
}

export interface ScannerOptions {
    verbose?: number
    manifest?: MasterCSSManifest,
    path?: string,
    exclude?: string[]
    safelist?: string[]
    blocklist?: (string | RegExp)[]
    adapters?: SourceAdapter[]
}

export { scannerOptions }
export default scannerOptions
