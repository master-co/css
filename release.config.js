const configure = require('semantic-release-config-aron/configure')

module.exports = configure({
    assets: [
        {
            path: 'packages/css/dist/index.browser.js',
            name: 'master-css.js',
            label: 'master-css.js'
        },
        {
            path: 'packages/normal.css/dist/index.css',
            name: 'master-normal.css',
            label: 'master-normal.css'
        },
        {
            path: 'packages/keyframes.css/dist/index.css',
            name: 'master-keyframes.css',
            label: 'master-keyframes.css'
        }
    ],
    scripts: {
        prepare: 'npm run check && npm run build',
        publish: 'aron version ${nextRelease.version} && npm publish --workspaces --access public && npm run publish'
    }
})