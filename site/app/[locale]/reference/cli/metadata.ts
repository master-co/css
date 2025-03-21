import define from 'internal/utils/metadata'

const metadata = define({
    title: 'CLI',
    description: 'Command line interface for Master CSS.',
    category: 'Package',
    fileURL: import.meta.url,
    package: {
        npm: '@master/create-css',
        source: 'https://github.com/master-co/css/tree/rc/packages/cli'
    }
})

export default metadata