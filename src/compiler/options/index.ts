import extract from './extract'

const defaultOptions = {
    output: 'master.css',
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

export default defaultOptions