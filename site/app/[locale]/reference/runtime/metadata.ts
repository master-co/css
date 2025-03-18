import define from 'internal/utils/metadata'

const metadata = define({
    title: 'Runtime',
    description: 'The core syntax parsing and runtime engine of Master CSS.',
    category: 'Integration',
    fileURL: import.meta.url,
    package: {
        npm: '@master/css-runtime',
        source: '/tree/rc/packages/runtime'
    }
})

export default metadata