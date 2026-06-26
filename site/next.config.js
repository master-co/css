import redirects from './redirects.js'
import withCommonNextConfig from 'internal/common/with-next-config.js'
import { withMasterCSS } from '@master/css.next'

const nextConfig = withMasterCSS(await withCommonNextConfig({
    redirects
}))

export default nextConfig
