import type { Config } from 'techor'

export default {
    build: {
        swc: {
            jsc: {
                parser: {
                    syntax: 'typescript',
                    tsx: true,
                }
            }
        }
    }
} as Config