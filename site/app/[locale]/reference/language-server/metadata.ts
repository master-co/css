import define from 'internal/utils/metadata'

const metadata = define({
    title: 'Language Server',
    description: 'The language server reference for Master CSS.',
    category: 'Package',
    fileURL: import.meta.url,
    package: {
        npm: '@master/css-language-server',
        source: 'https://github.com/master-co/css/tree/rc/packages/language-server'
    }
})

export default metadata