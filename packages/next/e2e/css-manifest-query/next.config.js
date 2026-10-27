import { withMasterCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = await withMasterCSS({
  distDir: '.next-query',
  basePath: '/query',
  assetPrefix: '/assets'
})

export default nextConfig
