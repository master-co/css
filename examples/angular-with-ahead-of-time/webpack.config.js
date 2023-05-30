const { MasterCSSWebpackPlugin } = require('@master/css.webpack')

module.exports = (config) => {
    config.plugins.push(
        new MasterCSSWebpackPlugin()
    )
    return config
}