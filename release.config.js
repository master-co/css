import configure from '@aronrepo/semantic-release-config/configure'

export default configure({
  plugins: {
    '@semantic-release/github': {
      assets: [
        {
          path: 'packages/runtime/dist/global.min.js',
          name: 'global-${nextRelease.gitTag}.min.js',
          label: 'global-${nextRelease.gitTag}.min.js'
        }
      ]
    }
  }
})
