import define from 'internal/utils/metadata'

const metadata = define({
    title: '@master/css-language',
    description: 'The language declaration, TextMate grammars provide syntax highlighting and improved editor integration.',
    category: 'Package',
    type: 'entity',
    fileURL: import.meta.url,
    package: {
        npm: '@master/css-language',
        source: 'https://github.com/master-co/css/tree/rc/packages/language'
    }
})

export default metadata