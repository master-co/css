import plugin from './plugin'
import config from './config'
import settings from './settings'

module.exports = {
    ...plugin,
    configs: {
        recommended: {
            plugins: ['@master/css'],
            ...config
        },
        flat: {
            plugins: {
                '@master/css': plugin
            },
            ...config
        }
    },
    settings
}