const { MasterCSSWebpackPlugin } = require('@master/css-compiler')

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        appDir: true,
    },
    webpack: (config) => {
        config.plugins.push(
            new MasterCSSWebpackPlugin({
                output: {
                    dir: 'static/css'
                },
                debug: ['accepts']
            }),
        )
        return config
    }
}

module.exports = nextConfig
