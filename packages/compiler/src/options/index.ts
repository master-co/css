import MasterCSS from '@master/css'
import extract from './extract'

const options: CompilerOptions = {
    config: './master.css.js',
    output: {
        name: 'master.css',
        dir: ''
    },
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
        name: string
        dir: string
    },
    accept?: (source: CompilerSource) => boolean
    extract?: (source: CompilerSource, css: MasterCSS) => string[]
    config?: string
    debug?: string[] | boolean
}

export default options