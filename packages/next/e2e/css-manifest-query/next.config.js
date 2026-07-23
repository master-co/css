import { withMasterCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({}, {
  enabled: false
})

export default nextConfig
