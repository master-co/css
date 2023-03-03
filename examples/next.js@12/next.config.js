/* ahead-of-time */
// const { MasterCSSWebpackPlugin } = require('@master/css.webpack')

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    webpack: (config) => {
        /* ahead-of-time */
        // config.plugins.push(
        //     new MasterCSSWebpackPlugin(),
        // )
        return config
    }

}

module.exports = nextConfig
