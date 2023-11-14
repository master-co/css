const configure = require('semantic-release-config-techor/configure')

module.exports = configure({
    assets: [
        {
            path: 'packages/css/dist/runtime.browser.bundle.js',
            name: 'runtime-css.js',
            label: 'runtime-css.js'
        },
        {
            path: 'packages/css/dist/index.bundle.js',
            name: 'master-css.js',
            label: 'master-css.js'
        },
        {
            path: 'packages/normal.css/dist/index.css',
            name: 'master-normal.css',
            label: 'master-normal.css'
        }
    ]
})
