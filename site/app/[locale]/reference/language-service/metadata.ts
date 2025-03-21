import define from 'internal/utils/metadata'

const metadata = define({
    title: 'Language Service',
    description: 'The language service reference for Master CSS.',
    category: 'Package',
    fileURL: import.meta.url,
    package: {
        npm: '@master/css-language-service',
        source: 'https://github.com/master-co/css/tree/rc/packages/language-service'
    }
})

export default metadata