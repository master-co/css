import redirects from './redirects.mjs'
import withCommonNextConfig from 'internal/common/with-next-config.mjs'
import { withMasterCSS } from '@master/css.next'

const corePackageFile = (filename) => `../packages/core/${filename}`

const nextConfig = withMasterCSS(await withCommonNextConfig({
    redirects,
    turbopack: {
        resolveAlias: {
            '@master/css': corePackageFile('dist/index.mjs'),
            '@master/css/config': corePackageFile('dist/config.mjs'),
            '@master/css/utils': corePackageFile('dist/utils.mjs'),
            '@master/css/base.css': corePackageFile('base.css'),
            '@master/css/index.css': corePackageFile('index.css'),
            '@master/css/theme.css': corePackageFile('theme.css'),
            '@master/css/create-config-from-css-directives': corePackageFile('dist/create-config-from-css-directives.mjs')
        }
    }
}))

export default nextConfig
