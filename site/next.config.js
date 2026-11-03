/** @type {import('next').NextConfig} */
const path = require('path')
const { i18n } = require('./next-i18next.config')

const examplesPaths = [
    path.resolve(__dirname, 'pages/examples'),
    path.resolve(__dirname, 'pages/css/examples')
]

const nextConfig = {
    i18n,
    images: {
        unoptimized: true,
    },
    reactStrictMode: true,
    sassOptions: {
        includePaths: [
            path.join(__dirname, 'styles')
        ],
    },
    async redirects() {
        return [
            {
                source: '/docs',
                destination: '/docs/setup',
                permanent: true,
            },
        ]
    },
    webpack: (config) => {
        config.module.rules.push({
            test: /\.svg$/i,
            use: [
                {
                    loader: '@svgr/webpack',
                    options: {
                        svgoConfig: {
                            plugins: [
                                {
                                    name: 'removeViewBox',
                                    params: false
                                }
                            ],
                        },
                    }
                }
            ]
        })

        config.module.rules.push({
            test: /\.tsx$/i,
            loader: path.resolve(__dirname, 'loaders/addLinkSvg.js')
        })

        config.module.rules.push({
            test: /\.tsx$/i,
            include: [
                path.resolve(__dirname, 'pages/docs')
            ],
            use: [
                { loader: path.resolve(__dirname, 'loaders/sections.js') },
                { loader: path.resolve(__dirname, 'loaders/nav.js') },
            ]
        })

        config.module.rules.push({
            resourceQuery: /clearCodeTokens/,
            use: [
                { loader: path.resolve(__dirname, 'loaders/clearCodeTokens.js') },
            ]
        })

        config.module.rules.push({
            resourceQuery: /react2markup/,
            exclude: examplesPaths,
            use: [
                { loader: 'raw-loader' },
                { loader: path.resolve(__dirname, 'loaders/react2markup.js') }
            ]
        })

        config.module.rules.push({
            test: /\.tsx$/i,
            include: examplesPaths,
            oneOf: [
                {
                    resourceQuery: /react2markup/,
                    use: [
                        { loader: 'raw-loader' },
                        { loader: path.resolve(__dirname, 'loaders/react2markup.js') }
                    ]
                }, {
                    loader: path.resolve(__dirname, 'loaders/clearCodeTokens.js')
                }
            ]
        })

        return config
    }
}

module.exports = nextConfig
