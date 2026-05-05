import { withMasterCSS } from '../dist/index.mjs'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({
    reactStrictMode: true
}, {
    manifest: true,
    debug: true
})

export default nextConfig
