const MasterCSSWebpackPlugin = require('@master/css.webpack').default

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    webpack: (config) => {
        config.plugins.push(
            new MasterCSSWebpackPlugin({ debug: true }),
        )
        return config
    }
}

module.exports = nextConfig
