const { CSSExtractorPlugin } = require('@master/css-extractor.webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.plugins.push(
            new CSSExtractorPlugin()
        )
        return config
    }
}

module.exports = nextConfig
