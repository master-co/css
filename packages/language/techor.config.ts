import { Config } from 'techor'
import glob from 'fast-glob'

export default {
    build: {
        input: {
            external: glob.sync(new URL('./syntaxes/*.json', import.meta.url).pathname)
        }
    }
} as Config