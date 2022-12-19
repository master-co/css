import MasterCSS, { Config } from '@master/css'
import extract from './extract'
import type { Pattern as FastGlobPattern } from 'fast-glob'

const options: CompilerOptions = {
    cwd: process.cwd(),
    config: 'master.css.{ts,js,mjs,cjs}',
    sources: [],
    include: ['**/*.{html,js,jsx,ts,tsx,svelte,astro,vue,md,mdx,pug,php}'],
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
    extract
}

export declare type CompilerSource = {
    name: string
    content: string
}

export interface CompilerOptions {
    extract?: (source: CompilerSource, css: MasterCSS) => string[]
    sources?: FastGlobPattern[]
    include?: FastGlobPattern[]
    exclude?: FastGlobPattern[]
    fixedClasses?: string[]
    ignoredClasses?: string[] | RegExp[]
    config?: string | Config
    debug?: boolean
    cwd?: string
}

export default options