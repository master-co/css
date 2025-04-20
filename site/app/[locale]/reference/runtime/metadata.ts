import define from 'internal/utils/metadata'
import pkg from '~/packages/runtime/package.json'

const metadata = define({
    title: pkg.name,
    description: pkg.description,
    category: 'Package',
    type: 'entity',
    fileURL: import.meta.url,
    package: {
        npm: pkg.name,
        source: 'https://github.com/master-co/css/tree/rc/' + pkg.repository.directory
    }
})

export default metadata