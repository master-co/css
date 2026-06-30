import redirects from './redirects.js'
import withCommonNextConfig from 'internal/common/with-next-config.js'
import { withMasterCSS } from '@master/css.next'
import { readPublicEnv } from './utils/public-env.js'

const nextConfig = withMasterCSS(await withCommonNextConfig({
    redirects
}))

nextConfig.output = 'export'
nextConfig.images = {
    ...nextConfig.images,
    unoptimized: true
}
nextConfig.env = {
    ...nextConfig.env,
    ...readPublicEnv()
}
delete nextConfig.redirects
delete nextConfig.rewrites

export default nextConfig
