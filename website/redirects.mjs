import i18n from 'shared/i18n.config.mjs'

const redirects = [
    { source: `/${i18n.defaultLocale}/:path((?!.*opengraph-image).*)`, destination: "/:path*", permanent: true },
    { source: "/docs", destination: "/docs/installation", permanent: false },
    { source: "/sandbox", destination: "/play", permanent: false },
    { source: "/sandbox/:path*", destination: "/play/:path*", permanent: false },
    { source: "/docs/guides", destination: "/docs/installation", permanent: false },
    { source: "/docs/language-service", destination: "/docs/language-service/vscode", permanent: false },
];

export default redirects