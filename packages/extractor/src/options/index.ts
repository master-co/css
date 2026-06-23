import type { MasterCSSManifest } from '@master/css-schema/manifest'
import type { Pattern as FastGlobPattern } from 'fast-glob'
import type { SourceAdapter } from '@master/css-source'

const options: Options = {
    // enable verbose Logs
    verbose: 1,
    // specify output file path
    output: 'master.css',
    // specify a compiled Master CSS manifest override
    manifest: undefined,
    // forcibly specify required sources for scanning, not excluded by `options.exclude`
    required: [],
    // specify sources for scanning
    include: ['**/*.{html,htm,js,jsx,mjs,cjs,ts,tsx,mts,cts,svelte,astro,vue,md,mdx,pug,php}'],
    // specify sources to exclude
    exclude: [
        '**/*.css',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*test.{js,cjs,mjs,ts}',
        '**/*.options.*',
        '**/*README.md',
        '**/dist/**',
        '**/out/**',
        '**/styles/**',
        '**/public/**',
        '**/.next/**',
        '**/.nuxt/**',
        '**/.svelte-kit/**',
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
        '**/node_modules/.cache/**',
        '**/node_modules/.vite/**',
    ],
    safelist: [],
    blocklist: [],
    adapters: [],
}

export interface Options {
    verbose?: number
    manifest?: MasterCSSManifest,
    output?: string,
    path?: string,
    required?: FastGlobPattern[]
    include?: FastGlobPattern[]
    exclude?: FastGlobPattern[]
    safelist?: string[]
    blocklist?: (string | RegExp)[]
    adapters?: SourceAdapter[]
}

export default options
