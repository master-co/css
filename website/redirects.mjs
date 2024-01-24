import i18n from './i18n.config.mjs'

const redirects = [
    { source: '/sandbox', destination: '/play', permanent: false },
    { source: '/sandbox/:path*', destination: '/play/:path*', permanent: false },
    { source: '/docs/guides', destination: '/docs/installation', permanent: false },
    { source: '/docs/language-service', destination: '/docs/language-service/vscode', permanent: false },
    { source: '/docs/spacing', destination: '/docs/spacing-and-sizing', permanent: false },
    { source: '/docs', destination: '/docs/introduction', permanent: false }
]

export default [
    { source: `/${i18n.defaultLocale}/:path((?!.*opengraph-image).*)`, destination: '/:path*', permanent: true },
    ...redirects,
    ...redirects
        .map((eachRedirect) => {
            return i18n.locales
                .filter((locale) => locale !== 'en')
                .map((locale) => {
                    return {
                        ...eachRedirect,
                        source: `/${locale}${eachRedirect.source}`,
                        destination: `/${locale}${eachRedirect.destination}`,
                    }
                })
                .flat()
        })
        .flat()
]