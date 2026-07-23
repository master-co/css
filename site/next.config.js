import redirects from './redirects.js'
import withCommonNextConfig from 'internal/common/with-next-config.js'
import withMasterCSS from '@master/css-next'
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
nextConfig.staticPageGenerationTimeout = 180
nextConfig.turbopack ??= {}
nextConfig.turbopack.resolveAlias = {
  ...nextConfig.turbopack.resolveAlias,
  '@master/css-backend/compiler': {
    browser: '../packages/native/src/broker-compiler-browser.ts'
  },
  '@master/css-backend/engine': {
    browser: '../packages/native/src/broker-engine-browser.ts'
  },
  '@master/css-backend/tooling': {
    browser: '../packages/native/src/broker-tooling-browser.ts'
  }
}
nextConfig.experimental = {
  ...nextConfig.experimental,
  staticGenerationMaxConcurrency: 1,
  staticGenerationMinPagesPerWorker: 100
}
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
