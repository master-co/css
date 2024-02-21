import type { Config } from '@master/css'
import type { Pattern as FastGlobPattern, Pattern } from 'fast-glob'

const options: Options = {
    // enable verbose Logs
    verbose: 1,
    // specify virtual CSS module id (e.g. .virtual:home.css)
    module: '.virtual/master.css',
    // specify options file path or set `Options`
    config: 'master.css',
    // forcibly specify sources for scanning, not excluded by `options.exclude`
    sources: [],
    // specify sources for scanning
    include: ['**/*.{html,js,jsx,ts,tsx,svelte,astro,vue,md,mdx,pug,php}'],
    // specify sources to exclude
    exclude: [
        '**/*.css',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*test.{js,cjs,mjs,ts}',
        '**/*.options.*',
        '**/*master.css.*',
        '**/*master.css-extractor.*',
        '**/*master.css-renderer.*',
        '**/*README.md',
        '**/dist/**',
        '**/out/**',
        '**/styles/**',
        '**/public/**',
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
    classes: {
        // whitelist of class names for unpredictable dynamics
        fixed: [],
        // blacklist of class names to exclude accidentally captured
        ignored: []  // or RegExp[]
    }
}

export interface Options {
    verbose?: number
    config?: Pattern | Pattern[] | Config,
    output?: string,
    path?: string,
    module?: string,
    sources?: FastGlobPattern[]
    include?: FastGlobPattern[]
    exclude?: FastGlobPattern[]
    classes?: {
        fixed?: string[]
        ignored?: string[] | RegExp[]
    }
}

export default options