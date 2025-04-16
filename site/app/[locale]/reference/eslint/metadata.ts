import define from 'internal/utils/metadata'

const metadata = define({
    title: '@master/eslint-config-css',
    description: 'The ESLint configuration and plugin reference for Master CSS.',
    category: 'Package',
    type: 'entity',
    fileURL: import.meta.url,
    package: {
        npm: '@master/eslint-config-css',
        source: 'https://github.com/master-co/css/tree/rc/packages/eslint-config'
    }
})

export default metadata