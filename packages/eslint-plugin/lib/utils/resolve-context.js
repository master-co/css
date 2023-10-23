'use strict'

const exploreConfig = require('explore-config').default

const resolveContext = function (context) {
    const settings = context.settings?.['@master/css']
    return {
        settings,
        options: context.options[0] || {},
        config: exploreConfig(settings?.config)
    }
}

module.exports = resolveContext