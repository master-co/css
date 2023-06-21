const { CSSExtractorPlugin } = require('@master/css-extractor.webpack')

module.exports = (config) => {
    config.plugins.push(
        new CSSExtractorPlugin()
    )
    return config
}