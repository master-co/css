import define from 'internal/utils/metadata'

const metadata = define({
    title: 'TextMate Grammars',
    description: 'The Master CSS TextMate Grammars provide syntax highlighting and improved editor integration.',
    category: 'Integration',
    fileURL: import.meta.url,
    package: {
        npm: '@master/css-textmate-grammars',
        source: 'https://github.com/master-co/css/tree/rc/packages/textmate-grammars'
    }
})

export default metadata