import define from 'internal/utils/metadata'
import pkg from '~/packages/language/package.json'

const metadata = define({
    title: pkg.name,
    description: pkg.description,
    category: 'Packages',
    type: 'entity',
    fileURL: import.meta.url,
    package: {
        npm: pkg.name,
        source: 'https://github.com/master-co/css/tree/rc/' + pkg.repository.directory
    }
})

export default metadata
