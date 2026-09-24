import i18n from './i18n.config.js'

export default [
  { source: `/${i18n.defaultLocale}/:path((?!.*opengraph-image).*)`, destination: '/:path*', permanent: true }
]