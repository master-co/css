const { build } = require('esbuild')
const fs = require('fs');
const { cssBuildConfig, compilerBuildConfig } = require('./package');

fs.rmSync('./dist', { recursive: true, force: true });

const config = {
    watch: {
        onRebuild(error, result) {
            if (error) console.error('watch build failed:', error)
            else console.log('watch build succeeded:', result)
        },
    }
}

/* @master/css */
build({
    ...config,
    ...cssBuildConfig
})
    .catch(() => process.exit(1))
    .then(result => {
        console.log('watching...')
    })

/* @master/css/compiler */
build({
    ...config,
    ...compilerBuildConfig
})
    .catch(() => process.exit(1))
    .then(result => {
        console.log('watching...')
    })
