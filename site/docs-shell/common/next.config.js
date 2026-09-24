import { createRequire } from 'node:module'
import withMDX from './with-mdx.js'
import withBundleAnalyzer from './with-bundle-analyzer.js'
import { defu } from 'defu'
import svgoConfig from './svgo.config.js'

const serializableSvgoConfig = JSON.parse(JSON.stringify(svgoConfig))
const require = createRequire(import.meta.url)

/** @type {import('next').NextConfig} */
let nextConfig = {
  turbopack: {
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.json'],
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

if (nextConfig.experimental?.turbo) {
  nextConfig.turbopack = defu(nextConfig.experimental?.turbo || {}, nextConfig.turbopack)
  delete nextConfig.experimental?.turbo
}

const safeAddLoader = (key, loader) => {
  const loaders = nextConfig.turbopack?.rules[key]?.loaders
  if (loaders) {
    loaders.push(loader)
  } else {
    nextConfig.turbopack.rules[key] = {
      loaders: [loader],
    }
  }
}

safeAddLoader('*.mdx', new URL('../loaders/raw-replace.cjs', import.meta.url).pathname)
safeAddLoader('*.ts', new URL('../loaders/raw-replace.cjs', import.meta.url).pathname)
safeAddLoader('*.tsx', new URL('../loaders/raw-replace.cjs', import.meta.url).pathname)

export default nextConfig
