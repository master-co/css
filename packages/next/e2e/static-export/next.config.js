import { withMasterCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({
  output: 'export'
}, { mode: 'progressive' })

export default nextConfig
