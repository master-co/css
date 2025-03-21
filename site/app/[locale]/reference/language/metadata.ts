import define from 'internal/utils/metadata'

const metadata = define({
    title: 'Language',
    description: 'The language declaration, TextMate grammars provide syntax highlighting and improved editor integration.',
    category: 'Package',
    fileURL: import.meta.url,
    package: {
        npm: '@master/css-language',
        source: 'https://github.com/master-co/css/tree/rc/packages/language'
    }
})

export default metadata