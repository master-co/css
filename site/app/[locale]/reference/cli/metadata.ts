import define from 'internal/utils/metadata'

const metadata = define({
    title: '@master/css-cli',
    description: 'Command line interface for Master CSS.',
    category: 'Package',
    type: 'entity',
    fileURL: import.meta.url,
    package: {
        npm: '@master/create-css',
        source: 'https://github.com/master-co/css/tree/rc/packages/cli'
    }
})

export default metadata