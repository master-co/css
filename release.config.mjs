import { configure } from 'semantic-release-config-techor'

export default configure({
    assets: [
        {
            path: 'packages/runtime/dist/global.min.js',
            name: 'global-${nextRelease.gitTag}.min.js',
            label: 'global-${nextRelease.gitTag}.min.js'
        },
        {
            path: 'packages/normal.css/dist/index.css',
            name: 'normal-${nextRelease.gitTag}.min.css',
            label: 'normal-${nextRelease.gitTag}.min.css'
        }
    ]
});
