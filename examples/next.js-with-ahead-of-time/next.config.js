const { MasterCSSWebpackPlugin } = require('@master/css.webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.plugins.push(
            new MasterCSSWebpackPlugin()
        )
        return config
    }
}

module.exports = nextConfig
