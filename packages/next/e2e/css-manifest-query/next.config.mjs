import { withMasterCSS } from '../../dist/index.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({}, {
    mode: null
})

export default nextConfig
