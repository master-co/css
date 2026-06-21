import type { Config } from 'techor'

const config: Config = {
    build: {
        input: {
            external: [/^\.\.\/\.\.\/syntaxes\/master-css\.tmLanguage\.json$/]
        }
    }
}

export default config
