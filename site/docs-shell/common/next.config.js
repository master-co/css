import { createRequire } from 'node:module'
import withMDX from './with-mdx.js'
import withBundleAnalyzer from './with-bundle-analyzer.js'
import svgoConfig from './svgo.config.js'

const serializableSvgoConfig = JSON.parse(JSON.stringify(svgoConfig))
const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
let nextConfig = {
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{
          loader: require.resolve('@svgr/webpack'),
          options: {
            svgo: true,
            svgoConfig: serializableSvgoConfig
          },
        }],
        as: '*.js',
      }
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'private-avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.opencollective.com' },
      { protocol: 'https', hostname: 'img.shields.io' },
      { protocol: 'https', hostname: 'images.pexels.com' }
    ],
  },
  serverExternalPackages: ['oxc-parser']
}

nextConfig = withMDX(nextConfig)
if (process.env.ANALYZE === 'true') nextConfig = withBundleAnalyzer(nextConfig)

export default nextConfig
