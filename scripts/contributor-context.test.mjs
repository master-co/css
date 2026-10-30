import { afterEach, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { contributorContext, extractDiffPaths } from './contributor-context.mjs'

const roots = []
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-contributor-')))
  roots.push(root)
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  for (const path of ['AGENTS.md', '.ai/context/index.md', '.ai/context/package-routing.md', '.ai/context/accuracy-guardrails.md', '.ai/context/testing.md', '.ai/context/rust-routing.md']) {
    write(path, `# Canonical ${path}\n`)
  }
  write('package.json', JSON.stringify({ name: 'repo', private: true, workspaces: ['packages/*', 'site'] }))
  write('packages/css/package.json', JSON.stringify({ name: '@master/css', scripts: { test: 'vitest', lint: 'eslint' }, exports: { '.': './dist/index.js' } }))
  write('packages/css/AI.md', '# Engine instructions\n')
  write('packages/css/src/special/AI.md', '# Nested instructions\n')
  write('packages/runtime/package.json', JSON.stringify({ name: '@master/css-runtime', dependencies: { '@master/css': 'workspace:*' }, scripts: { e2e: 'playwright test' } }))
  write('site/package.json', JSON.stringify({ name: 'site', private: true, scripts: { 'prepare-app': 'prepare' } }))
  write('site/AI.md', '# Site instructions\n')
  write('Cargo.toml', '[workspace]\nmembers = ["crates/*"]\n[workspace.dependencies]\ncore = { package = "mastercss-engine", path = "crates/engine" }\n')
  write('crates/engine/Cargo.toml', '[package]\nname = "mastercss-engine"\n')
  write('crates/engine/AI.md', '# Engine crate instructions\n')
  write('crates/render/Cargo.toml', '[package]\nname = "mastercss-render"\n[target.\'cfg(unix)\'.dependencies]\ncore = { workspace = true }\n')
  return root
}

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

test('routes current manifests and nested instructions without copying risk or validation policy', () => {
  const root = fixture()
  const result = contributorContext({ root, paths: ['packages/css/src/special/new.ts', 'site/content/new.mdx'], graph: true })
  expect(result.owners.map(owner => owner.name)).toEqual(['@master/css', 'site'])
  expect(result.owners[0]).toMatchObject({ scripts: { test: 'vitest', lint: 'eslint' }, dependents: ['@master/css-runtime'] })
  expect(result.context).toContain('packages/css/src/special/AI.md')
  expect(result.context).toContain('site/AI.md')
  expect(result.context).toContain('.ai/context/accuracy-guardrails.md')
  expect(result).not.toHaveProperty('risks')
  expect(result).not.toHaveProperty('validation')
  writeFileSync(join(root, 'packages/css/package.json'), JSON.stringify({ name: '@master/css', scripts: { test: 'new-runner' } }))
  expect(contributorContext({ root, paths: ['packages/css/deleted.ts'] }).owners[0].scripts).toEqual({ test: 'new-runner' })
})

test('resolves Rust workspace aliases and target dependencies from TOML', () => {
  const root = fixture()
  const result = contributorContext({ root, paths: ['crates/engine/src/session.rs'], graph: true })
  expect(result.owners[0]).toMatchObject({ name: 'mastercss-engine', kind: 'crate', dependents: ['mastercss-render'] })
  expect(result.context).toContain('Cargo.toml')
  expect(result.context).toContain('crates/engine/AI.md')
  expect(result.context).toContain('.ai/context/rust-routing.md')
})

test('reads deleted, renamed, spaced and Git-quoted Unicode diff paths', () => {
  const diff = [
    'diff --git a/packages/css/old name.ts b/packages/css/new name.ts',
    'rename from packages/css/old name.ts',
    'rename to packages/css/new name.ts',
    '--- a/site/deleted.mdx',
    '+++ /dev/null',
    '--- "a/site/\\346\\226\\207.mdx"',
    '+++ "b/site/\\346\\226\\207.mdx"',
    'diff --git a/site/logo.png b/site/logo.png',
    'Binary files a/site/logo.png and b/site/logo.png differ',
    'diff --git "a/site/😀.mdx" "b/site/😀.mdx"',
    '@@ -1 +1 @@',
    '--- ../../not-a-header'
  ].join('\n')
  expect(extractDiffPaths(diff)).toEqual(['packages/css/new name.ts', 'packages/css/old name.ts', 'site/deleted.mdx', 'site/logo.png', 'site/文.mdx', 'site/😀.mdx'])
  const result = contributorContext({ root: fixture(), diff })
  expect(result.owners.map(owner => owner.name)).toEqual(['@master/css', 'site'])
})

test('rejects paths outside the repo and workspaces without canonical guidance', () => {
  const root = fixture()
  expect(() => contributorContext({ root, paths: ['../outside.ts'] })).toThrow('outside the repository')
  expect(() => contributorContext({ root: join(root, 'site') })).toThrow('Expected Master CSS repository guidance')
})
