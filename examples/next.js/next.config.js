const { MasterCSSWebpackPlugin } = require('@master/css.webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    webpack: (config) => {
        config.plugins.push(
            new MasterCSSWebpackPlugin(),
        )
        return config
    }
}

module.exports = nextConfig
