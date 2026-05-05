import redirects from './redirects.mjs'
import withCommonNextConfig from 'internal/common/with-next-config.mjs'
import { withMasterCSS } from '@master/css.next'

const nextConfig = withMasterCSS(await withCommonNextConfig({
    redirects
}))

export default nextConfig
