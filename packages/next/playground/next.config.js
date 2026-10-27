import { withMasterCSS } from '../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = await withMasterCSS({
  reactStrictMode: true
}, {
  buildReport: true,
  debug: true
})

export default nextConfig
