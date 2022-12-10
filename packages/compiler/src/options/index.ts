import MasterCSS from '@master/css'
import extract from './extract'
import type { Pattern as FastGlobPattern } from 'fast-glob'

const options: CompilerOptions = {
    config: './master.css.js',
    output: {
        name: 'master.css',
        dir: ''
    },
    additions: [],
    cwd: process.cwd(),
    accept({ name }) {
        if (name.match(/[\\/]node_modules[\\/]/)) {
            return false
        }
        if (name.match(/\.(html|js|jsx|ts|tsx|svelte|astro|vue)$/i)) {
            return true
        }
    },
    extract
}

export declare type CompilerSource = {
    name: string
    content: string
}

export interface CompilerOptions {
    output?: {
        name?: string
        dir?: string
    },
    additions?: FastGlobPattern[]
    accept?: (source: CompilerSource) => boolean
    extract?: (source: CompilerSource, css: MasterCSS) => string[]
    config?: string
    debug?: boolean
    cwd?: string
}

export default options