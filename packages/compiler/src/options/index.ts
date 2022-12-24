import { Config } from '@master/css'
import type { Pattern as FastGlobPattern } from 'fast-glob'
import type { Options as TechorOptions } from 'techor'

const options: Options = {
    // specify virtual CSS module id (e.g. virtual:master.css)
    module: 'master.css',
    // specify config file path or set `Config`
    config: 'master.css.{ts,js,mjs,cjs}',
    // forcibly specify sources for scanning, not excluded by `options.exclude`
    sources: [],
    // specify sources for scanning
    include: ['**/*.{html,js,jsx,ts,tsx,svelte,astro,vue,md,mdx,pug,php}'],
    // specify sources to exclude
    exclude: [
        '**/node_modules/**',
        '**/*.d.ts',
        '**/*.test.*',
        'node_modules',
        'master.css.{js,ts,mjs,cjs}',
        'dist',
        'out',
        'README.md'
    ],
    // whitelist of class names for unpredictable dynamics
    fixedClasses: [],
    // blacklist of class names to exclude accidentally captured
    ignoredClasses: [], // or RegExp[]
}

export declare type Source = {
    name: string
    content: string
}

export interface Options extends TechorOptions<Config> {
    module?: string,
    sources?: FastGlobPattern[]
    include?: FastGlobPattern[]
    exclude?: FastGlobPattern[]
    fixedClasses?: string[]
    ignoredClasses?: string[] | RegExp[]
}

export default options