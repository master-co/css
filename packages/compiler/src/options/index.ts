import { Config } from '@master/css'
import type { Pattern as FastGlobPattern } from 'fast-glob'
import type { Options as TechorOptions } from 'techor'

const options: Options = {
    standalone: true,
    // specify config file path or set `Config`
    path: 'master.css-compiler.*',
    // specify virtual CSS module id (e.g. virtual:master.css)
    module: 'master.css',
    // specify config file path or set `Config`
    config: 'master.css.*',
    // forcibly specify sources for scanning, not excluded by `options.exclude`
    sources: [],
    // specify sources for scanning
    include: ['**/*.{html,js,jsx,ts,tsx,svelte,astro,vue,md,mdx,pug,php}'],
    // specify sources to exclude
    exclude: [
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.config.*',
        'master.css.*',
        'dist',
        'out',
        'styles',
        'public',
        'README.md'
    ],
    classes: {
        // whitelist of class names for unpredictable dynamics
        fixed: [],
        // blacklist of class names to exclude accidentally captured
        ignored: []  // or RegExp[]
    }
}

export declare type Source = {
    name: string
    content: string
}

export interface Options extends TechorOptions<Config> {
    standalone?: boolean,
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