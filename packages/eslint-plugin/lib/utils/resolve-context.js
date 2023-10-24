const settings = require('../settings')
const exploreConfig = require('explore-config').default

const resolveContext = function (context) {
    const resolvedSettings = Object.assign(settings, context.settings?.['@master/css'])
    const config = resolvedSettings?.config
    return {
        settings: resolvedSettings,
        options: context.options[0] || {},
        config: typeof config === 'object' ? config : exploreConfig(resolvedSettings?.config || '')
    }
}

module.exports = resolveContext