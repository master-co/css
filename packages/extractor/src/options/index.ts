import type { Config } from '@master/css'
import type { Pattern as FastGlobPattern, Pattern } from 'fast-glob'

const options: Options = {
    // specify virtual CSS module id (e.g. virtual:master.css)
    module: 'master.css',
    // specify options file path or set `Options`
    config: 'master.css.*',
    // forcibly specify sources for scanning, not excluded by `options.exclude`
    sources: [],
    // specify sources for scanning
    include: ['**/*.{html,js,jsx,ts,tsx,svelte,astro,vue,md,mdx,pug,php}'],
    // specify sources to exclude
    exclude: [
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.options.*',
        '**/*master.css.*',
        '**/*master.css-extractor.*',
        '**/*master.css-renderer.*',
        '**/*README.md',
        '**/dist/**',
        'dist',
        '**/out/**',
        'out',
        '**/styles/**',
        'styles',
        '**/public/**',
        'public'
    ],
    classes: {
        // whitelist of class names for unpredictable dynamics
        fixed: [],
        // blacklist of class names to exclude accidentally captured
        ignored: []  // or RegExp[]
    },
    cwd: process.cwd()
}

export interface Options {
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
    },
    cwd?: string
}

export default options