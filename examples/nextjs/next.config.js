const { MasterCSSWebpackPlugin } = require('@master/css-compiler')

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
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
