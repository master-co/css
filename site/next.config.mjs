import redirects from './redirects.mjs'
import withCommonNextConfig from 'internal/common/with-next-config.mjs'

const nextConfig = await withCommonNextConfig({
    redirects
})

export default nextConfig