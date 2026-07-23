import redirects from './redirects.js'
import withCommonNextConfig from 'internal/common/with-next-config.js'
import { withMasterCSS } from '@master/css-next'
import { readPublicEnv } from './utils/public-env.js'
import { shouldUseCloudflareImageLoader } from './utils/cloudflare-image-loader.js'

const publicEnv = readPublicEnv()
const useCloudflareImageLoader = shouldUseCloudflareImageLoader({
  env: process.env,
  siteUrl: publicEnv.NEXT_PUBLIC_URL
})

const nextConfig = withMasterCSS(await withCommonNextConfig({
  redirects
}))

nextConfig.output = 'export'
nextConfig.images = {
  ...nextConfig.images,
  ...(useCloudflareImageLoader
    ? {
      loader: 'custom',
      loaderFile: './utils/cloudflare-image-loader.js',
      unoptimized: false
    }
    : {
      unoptimized: true
    })
}
nextConfig.env = {
  ...nextConfig.env,
  ...publicEnv
}
delete nextConfig.redirects
delete nextConfig.rewrites

export default nextConfig
