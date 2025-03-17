import { Config } from 'techor'
import glob from 'fast-glob'

export default {
    build: {
        input: {
            external: glob.sync('./grammars/*.json', { absolute: true })
        }
    }
} as Config