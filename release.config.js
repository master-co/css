import configure from '@aronrepo/semantic-release-config/configure'

export default configure({
  plugins: {
    '@semantic-release/github': {
      assets: [
        {
          path: 'packages/runtime/dist/global.min.js',
          name: 'global-${nextRelease.gitTag}.min.js',
          label: 'global-${nextRelease.gitTag}.min.js'
        },
        {
          path: 'packages/runtime/artifacts/mastercss_wasm_runtime_bg.wasm',
          name: 'runtime-${nextRelease.gitTag}.wasm',
          label: 'runtime-${nextRelease.gitTag}.wasm'
        },
        {
          path: 'packages/preset/dist/default-manifest.json',
          name: 'default-manifest-${nextRelease.gitTag}.json',
          label: 'default-manifest-${nextRelease.gitTag}.json'
        },
        {
          path: 'release-artifacts/checksums.json',
          name: 'checksums-${nextRelease.gitTag}.json',
          label: 'checksums-${nextRelease.gitTag}.json'
        }
      ]
    }
  }
})
