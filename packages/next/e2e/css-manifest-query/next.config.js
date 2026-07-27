import { withMasterCSS } from '../../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({}, {
  mode: 'runtime',
  runtime: false
})

export default nextConfig
