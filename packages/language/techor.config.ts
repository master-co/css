import { Config } from 'techor'
import glob from 'fast-glob'

export default {
    build: {
        input: {
            external: glob.sync('./syntaxes/*.json', { absolute: true })
        }
    }
} as Config