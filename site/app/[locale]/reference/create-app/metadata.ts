import define from 'internal/utils/metadata'

const metadata = define({
    title: 'Create App',
    description: 'Set up or create a modern web app by running one command.',
    category: 'Integration',
    order: 1,
    fileURL: import.meta.url,
    package: {
        npm: '@master/create-css',
        source: 'https://github.com/master-co/css/tree/rc/packages/create'
    }
})

export default metadata