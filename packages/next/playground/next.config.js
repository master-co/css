import { withMasterCSS } from '../dist/index.js'

/** @type {import('next').NextConfig} */
const nextConfig = withMasterCSS({
    reactStrictMode: true
}, {
    buildReport: true,
    debug: true
})

export default nextConfig
