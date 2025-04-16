const { MasterCSSExtractorPlugin } = require('@master/css.webpack')

/** @type {import('webpack').Configuration} */
const webpackConfig = {
    plugins: [
        new MasterCSSExtractorPlugin()
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
