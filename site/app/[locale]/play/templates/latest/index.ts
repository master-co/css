import { nanoid } from 'nanoid'

export default {
    version: process.env.NEXT_PUBLIC_VERSION,
    files: [
        {
            title: 'HTML',
            name: 'index.html',
            language: 'html' as const,
            id: nanoid(),
            content: require('./example.html?raw')
        },
        {
            title: 'CSS',
            name: 'index.css',
            language: 'css' as const,
            id: nanoid(),
            content: require('./example.css?raw')
        }
    ]
}
