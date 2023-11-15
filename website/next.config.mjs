import redirects from './redirects.mjs'
import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'
import withMDX from 'websites/width-mdx.mjs'
import withWebpackConfig from 'websites/with-webpack-config.mjs'
import withBundleAnalyzer from 'websites/with-bundle-analyzer.mjs'

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    experimental: {
        /**
         * 解決 JavaScript heap out of memory 問題
         */
        webpackBuildWorker: true,
        /**
         * 不要啟用。會導致莫名的 MDX 內容解析錯誤，從而無法正確 build
         */
        // mdxRs: true
        /**
         * 解決：You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file.
         */
        externalDir: true
    },
    async redirects() {
        return redirects
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com'
            },
            {
                protocol: 'https',
                hostname: 'images.opencollective.com'
            },
            {
                protocol: 'https',
                hostname: 'img.shields.io'
            },
            {
                protocol: 'https',
                hostname: 'images.pexels.com'
            }
        ],
    },
    modularizeImports: {
        '@tabler/icons-react': {
            transform: '@tabler/icons-react/dist/esm/icons/{{member}}',
        }
    },
    pageExtensions: ['mdx', 'md', 'jsx', 'js', 'tsx', 'ts'],
    async rewrites() {
        return [
            {
                source: '/cdn/:path*',
                destination: 'https://cdn.jsdelivr.net/npm/@master/:path*',
            }
        ]
    },
    webpack: (config) => {
        config.plugins.push(
            new CopyPlugin({
                patterns: [
                    { from: './node_modules/monaco-editor/min/vs', to: path.resolve('public/monaco-editor/vs') }
                ],
            })
        )
        return withWebpackConfig(config)
    }
}

export default withBundleAnalyzer(withMDX(nextConfig))