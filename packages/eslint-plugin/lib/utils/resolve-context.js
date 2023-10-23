'use strict'

const exploreConfig = require('explore-config').default

const resolveContext = function (context) {
    const settings = Object.assign({
        callees: ['classnames', 'clsx', 'ctl', 'cva', 'cv', 'classVariant', 'styled'],
        ignoredKeys: ['compoundVariants', 'defaultVariants'],
        classMatching: '^class(Name)?$',
        config: 'master.css.*',
        tags: []
    }, context.settings?.['@master/css'])
    return {
        settings,
        options: context.options[0] || {},
        config: exploreConfig(settings?.config || '')
    }
}

module.exports = resolveContext