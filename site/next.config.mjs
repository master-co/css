import withSharedWebpackConfig from "../../../shared/with-shared-webpack-config.mjs";
import redirects from './redirects.mjs';
import CopyPlugin from 'copy-webpack-plugin'
import path from 'path'

import nextMDX from '@next/mdx'
import remarkSlug from 'remark-slug';
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm';
import remarkCodeMeta from '../../../shared/remark/code-meta.mjs';

const withMDX = nextMDX({
    extension: /\.mdx?$/,
    options: {
        // If you use remark-gfm, you'll need to use next.config.mjs
        // as the package is ESM only
        // https://github.com/remarkjs/remark-gfm#install
        remarkPlugins: [
            remarkSlug,
            remarkGfm,
            remarkCodeMeta
        ],
        rehypePlugins: [
            rehypeSlug
        ],
        // If you use `MDXProvider`, uncomment the following line.
        // providerImportSource: "@mdx-js/react",
    },
})


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
        return redirects;
    },
    // Optionally, add any other Next.js config below
    reactStrictMode: true,
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
        return withSharedWebpackConfig(config)
    }
}

import BundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = BundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
export default withBundleAnalyzer(withMDX(nextConfig))

// export default withMDX(nextConfig)
