/** @type {import('aronrepo').AronrepoConfig} */
export default {
  release: {
    // Only the owner raises minor and major versions, with Bump(Minor) and Bump(Major) commits.
    mode: 'explicit',
    // scripts/release.mjs attaches these to the GitHub release after npm promotion.
    assets: [
      { path: 'release-artifacts/release-notes.md', name: 'release-notes-{tag}.md', label: 'Complete release notes' },
      { path: 'packages/runtime/dist/global.min.js', name: 'global-{tag}.min.js', label: 'global-{tag}.min.js' },
      { path: 'packages/runtime/dist/default-program.bin', name: 'default-program-{tag}.bin', label: 'default-program-{tag}.bin' },
      { path: 'release-artifacts/checksums.json', name: 'checksums-{tag}.json', label: 'checksums-{tag}.json' }
    ]
  }
}
