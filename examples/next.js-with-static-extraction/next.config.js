const { CSSExtractorPlugin } = require('@master/css-extractor.webpack')

/** @type {import('webpack').Configuration} */
const webpackConfig = {
    plugins: [
        new CSSExtractorPlugin()
    ]
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.plugins.push(...webpackConfig.plugins)
        return config
    }
}

module.exports = nextConfig
