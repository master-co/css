import plugin from './plugin'
import config from './configs/config'
import settings from './settings'
import recommended from './configs/recommended'
import flat from './configs/flat'

module.exports = {
    ...plugin,
    configs: {
        recommended,
        flat
    },
    settings
}