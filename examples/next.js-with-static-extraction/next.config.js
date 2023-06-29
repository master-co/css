const { CSSExtractorPlugin } = require('@master/css-extractor.webpack')
const cssExtractorPlugin = new CSSExtractorPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.plugins.push(
            cssExtractorPlugin
        )
        return config
    }
}

module.exports = nextConfig
