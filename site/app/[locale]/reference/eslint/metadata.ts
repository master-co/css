import define from 'internal/utils/metadata'

const metadata = define({
    title: 'ESLint',
    description: 'The ESLint configuration and plugin reference for Master CSS.',
    category: 'Integration',
    fileURL: import.meta.url,
    package: {
        npm: '@master/eslint-config-css',
        source: 'https://github.com/master-co/css/tree/rc/packages/eslint-config'
    }
})

export default metadata