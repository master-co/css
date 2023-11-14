import { nanoid } from 'nanoid'

export default {
    version: '1.37.2',
    files: [
        {
            title: 'HTML',
            name: 'index.html',
            language: 'html',
            id: nanoid(),
            content: require('./example.html?text').default,
        },
        {
            title: 'Config',
            name: 'master.css.js',
            language: 'javascript',
            id: nanoid(),
            content: require('./config.js?text').default
        }
    ],
    dependencies: {
        styles: [
            { src: '/cdn/normal.css@1.9.7' }
        ],
        scripts: [
            { text: 'window.MasterCSSManual = true' },
            { src: '/cdn/css@1.37.2' }
        ],
    },
    links: [
        { rel: 'preload', as: 'style', href: '/cdn/normal.css@1.9.7' },
        { rel: 'preload', as: 'script', href: '/cdn/css@1.37.2' }
    ]
}