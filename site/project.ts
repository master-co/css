import pkg from 'shared/package.json'

const project = {
    name: 'CSS',
    id: 'css',
    version: pkg.dependencies['@master/css.react'].slice(1)
}

export default project