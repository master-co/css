/** @type {import('aronrepo').AronrepoConfig} */
export default {
  release: {
    // Only the owner raises minor and major versions, with Bump(Minor) and Bump(Major) commits.
    mode: 'explicit',
    // Files whose changes ship to npm, so only their commits may use a release type.
    // Derived paths would cover public packages only, but the Rust crates compile into the
    // binding packages and the private internal and engine-js workspaces are bundled into them.
    paths: {
      include: [
        'packages/**',
        '!packages/*/playground/**',
        'crates/**',
        '!crates/xtask/**',
        '!crates/**/tests.rs',
        'Cargo.toml',
        'Cargo.lock',
        'rust-toolchain.toml',
        'shared/tsdown-package.config.ts'
      ]
    },
    // scripts/release.mjs attaches these to the GitHub release after npm promotion.
    assets: [
      { path: 'release-artifacts/release-notes.md', name: 'release-notes-{tag}.md', label: 'Complete release notes' },
      { path: 'packages/runtime/dist/global.min.js', name: 'global-{tag}.min.js', label: 'global-{tag}.min.js' },
      { path: 'packages/runtime/dist/default-program.bin', name: 'default-program-{tag}.bin', label: 'default-program-{tag}.bin' },
      { path: 'release-artifacts/checksums.json', name: 'checksums-{tag}.json', label: 'checksums-{tag}.json' }
    ]
  }
}
