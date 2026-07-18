import { withMasterCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({
  output: 'export'
})

export default nextConfig
