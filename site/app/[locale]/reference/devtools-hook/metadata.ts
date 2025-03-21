import define from 'internal/utils/metadata'

const metadata = define({
    title: 'DevTools Hook',
    description: 'A global bridge injected into the browser runtime.',
    category: 'Package',
    fileURL: import.meta.url,
    package: {
        npm: '@master/css-devtools-hook',
        source: 'https://github.com/master-co/css/tree/rc/packages/devtools-hook'
    }
})

export default metadata