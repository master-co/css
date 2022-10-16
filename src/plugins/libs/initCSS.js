const { default: MasterCSS, configure, extend } = require('../../index')
const path = require('path')
const extractClasses = require('./extractClasses')
const pluginDefaultConfig = {
    output: 'master.css',
    extract({ source, name, ext }) {
        if (
            name.match(/[\\/]node_modules[\\/]/) ||
            !['.html', '.js', '.ts'].includes(ext)
        ) return []
        return extractClasses(source)
    }
}

module.exports = function initCSS() {
    let userConfig

    try {
        userConfig = require(path.resolve(process.cwd(), './master.css.js'));
    } catch (err) {
        console.log(err)
    }

    const config = userConfig
        ? extend(pluginDefaultConfig, userConfig)
        : configure(pluginDefaultConfig)

    return new MasterCSS(config)
}