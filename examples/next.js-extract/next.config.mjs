import { withMasterCSS } from '@master/css.next'

/** @type {import('next').NextConfig} */
const nextConfig = await withMasterCSS({}, {
    mode: 'extract'
})

export default nextConfig
