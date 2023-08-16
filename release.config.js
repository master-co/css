const configure = require('semantic-release-config-techor/configure')

module.exports = configure({
    assets: [
        {
            path: 'packages/css/dist/index.browser.bundle.js',
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
