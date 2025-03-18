import define from 'internal/utils/metadata'

const metadata = define({
    title: 'CLI',
    description: 'Command line interface for Master CSS.',
    category: 'Integration',
    fileURL: import.meta.url,
    package: {
        npm: '@master/create-cli',
        source: 'https://github.com/master-co/css/tree/rc/packages/cli'
    }
})

export default metadata