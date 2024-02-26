import plugin from './plugin'
import settings from './settings'
import recommended from './configs/recommended'
import flat from './configs/flat'

/** @type {import('typescript-eslint').Config} */
export default {
    ...plugin,
    configs: {
        recommended,
        flat
    },
    settings
}