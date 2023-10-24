'use strict'

const exploreConfig = require('explore-config').default

const resolveContext = function (context) {
    const settings = Object.assign({
        functions: ['classnames', 'clsx', 'ctl', 'cva', 'cv', 'classVariant', 'styled'],
        ignoredKeys: ['compoundVariants', 'defaultVariants'],
        classMatching: '^class(Name)?$',
        config: 'master.css.*'
    }, context.settings?.['@master/css'])
    const config = settings?.config
    return {
        settings,
        options: context.options[0] || {},
        config: typeof config === 'object' ? config : exploreConfig(settings?.config || '')
    }
}

module.exports = resolveContext