const configure = require('semantic-release-config-techor/configure')

module.exports = configure({
    assets: [
        {
            path: 'packages/css/dist/index.bundle.js',
            name: 'css-${nextRelease.gitTag}.js',
            label: 'css-${nextRelease.gitTag}.js'
        },
        {
            path: 'packages/runtime/dist/iife.bundle.js',
            name: 'runtime-${nextRelease.gitTag}.js',
            label: 'runtime-${nextRelease.gitTag}.js'
        },
        {
            path: 'packages/normal.css/dist/index.css',
            name: 'normal-${nextRelease.gitTag}.css',
            label: 'normal-${nextRelease.gitTag}.css'
        }
    ]
})
