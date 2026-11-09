import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { YAML } from 'bun'
import { test } from 'bun:test'

const workflow = YAML.parse(readFileSync(new URL('../.github/workflows/validation.yml', import.meta.url), 'utf8'))
const selectConsumers = workflow.jobs.quality_linux.steps.find(step => step.id === 'consumers').run

function selection(options, script = selectConsumers) {
  return run(options, script).output
}

function run({ full, range, site = false, vscode = false, changed = [], queryFailure = false, diffFailure = false,
  release = false, planned = '', published = '', lookupFailure = false }, script) {
  const root = mkdtempSync(join(tmpdir(), 'master-validation-'))
  try {
    const output = join(root, 'outputs')
    const calls = join(root, 'calls')
    // Exercise the workflow's actual shell control flow. The affected query
    // reports no changes for base=head, as manual full validation commonly has.
    writeFileSync(join(root, 'bun'), `#!/usr/bin/env bash
printf '%s %s\\n' "$TURBO_SCM_BASE" "$*" >> "$QUERY_CALLS"
if [ "$QUERY_FAILURE" = true ]; then echo 'Simulated affected query failure' >&2; exit 2; fi
case "$*" in
  *--filter=site*) printf '%s\\n' '{"tasks":${site ? '[{"taskId":"site#build"}]' : '[]'}}' ;;
  *) printf '%s\\n' '{"tasks":${vscode ? '[{"taskId":"@master/css-vscode#build"}]' : '[]'}}' ;;
esac
`, { mode: 0o755 })
    writeFileSync(join(root, 'git'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$GIT_CALLS"
if [ "$DIFF_FAILURE" = true ]; then echo 'Simulated diff failure' >&2; exit 2; fi
printf '%s\\n' "$CHANGED_FILES"
`, { mode: 0o755 })
    // Stand in for the store lookup: print the served editor's revision, if proven.
    writeFileSync(join(root, 'node'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$NODE_CALLS"
if [ "$LOOKUP_FAILURE" = true ]; then echo 'Simulated lookup failure' >&2; exit 2; fi
if [ -n "$PUBLISHED_REVISION" ]; then printf '%s\\n' "$PUBLISHED_REVISION"; fi
`, { mode: 0o755 })
    const result = spawnSync('bash', ['-c', script], {
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, GITHUB_OUTPUT: output, QUERY_CALLS: calls,
        GIT_CALLS: join(root, 'git-calls'), NODE_CALLS: join(root, 'node-calls'),
        FULL_VALIDATION: String(full), RANGE_VALID: String(range), TURBO_SCM_BASE: 'base', TURBO_SCM_HEAD: 'head',
        RELEASE_BUILD: String(release), RELEASE_VERSION: planned, PUBLISHED_REVISION: published,
        LOOKUP_FAILURE: String(lookupFailure),
        CHANGED_FILES: changed.join('\n'), QUERY_FAILURE: String(queryFailure), DIFF_FAILURE: String(diffFailure) },
      encoding: 'utf8'
    })
    assert.equal(result.status, 0, result.stderr)
    const lines = name => existsSync(join(root, name)) ? readFileSync(join(root, name), 'utf8').split('\n').filter(Boolean) : []
    return { output: readFileSync(output, 'utf8'), queries: lines('calls'), git: lines('git-calls'), node: lines('node-calls') }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('manual full validation selects site and editor even when base equals head', () => {
  assert.equal(selection({ full: true, range: true }), 'site_affected=true\nvscode_affected=true\n')
})

test('an unavailable comparison range conservatively selects both consumers', () => {
  assert.equal(selection({ full: false, range: false }), 'site_affected=true\nvscode_affected=true\n')
})

test('affected validation keeps independent site and editor selection', () => {
  assert.equal(selection({ full: false, range: true }), 'site_affected=false\nvscode_affected=false\n')
  assert.equal(selection({ full: false, range: true, site: true }), 'site_affected=true\nvscode_affected=false\n')
  assert.equal(selection({ full: false, range: true, vscode: true }), 'site_affected=false\nvscode_affected=true\n')
})

const selectDelivery = workflow.jobs.editor_delivery.steps.find(step => step.id === 'delivery').run

test('full validation alone does not re-publish an unchanged editor version', () => {
  assert.equal(selection({ full: true, range: true }, selectDelivery), 'vscode_release_affected=false\n')
  assert.equal(selection({ full: true, range: true, vscode: true }, selectDelivery), 'vscode_release_affected=true\n')
  assert.equal(selection({ full: true, range: false }, selectDelivery), 'vscode_release_affected=true\n')
})

test('native and shared build inputs select editor delivery without relying on Turbo package selection', () => {
  for (const file of ['crates/mastercss-tooling/src/lib.rs', 'Cargo.toml', 'Cargo.lock', 'rust-toolchain.toml',
    '.cargo/config.toml', 'shared/tsdown-package.config.ts', 'scripts/build-rust-mdn-completion-registry.mjs',
    'scripts/typescript-api.mjs', 'scripts/typescript-declarations.mjs', 'scripts/toolchain-policy.mjs',
    'scripts/isolate-tooling-typescript.mjs']) {
    assert.equal(selection({ full: false, range: true, changed: [file] }, selectDelivery), 'vscode_release_affected=true\n', file)
  }
  assert.equal(selection({ full: true, range: true, changed: ['site/content/page.astro', 'scripts/pages-release-target.mjs'] }, selectDelivery), 'vscode_release_affected=false\n')
})

test('failed affected or native-input queries cannot silently skip editor delivery', () => {
  assert.throws(() => selection({ full: true, range: true, queryFailure: true }, selectDelivery), /Simulated affected query failure/)
  assert.throws(() => selection({ full: true, range: true, diffFailure: true }, selectDelivery), /Simulated diff failure/)
})

test('a release compares editor inputs with the revision of the editor the stores serve', () => {
  const served = run({ full: true, range: true, release: true, planned: '2.1.1', published: 'v2.1.0-sha', vscode: true }, selectDelivery)
  assert.equal(served.output, 'vscode_release_affected=true\n')
  assert.deepEqual(served.node, ['packages/vscode/scripts/published-editor-revision.mjs --head head'])
  assert.match(served.queries[0], /^v2\.1\.0-sha run turbo run build --filter=@master\/css-vscode --affected/)
  assert.deepEqual(served.git, ['diff --name-only v2.1.0-sha...head'])
  // The previous push's range is not consulted: a failed release's editor changes would drop out of it.
  assert.equal(run({ full: true, range: true, release: true, planned: '2.1.1', published: 'v2.1.0-sha' }, selectDelivery).output,
    'vscode_release_affected=false\n')
  assert.equal(run({ full: true, range: true, release: true, planned: '2.1.1', published: 'v2.1.0-sha',
    changed: ['crates/mastercss-lexer/src/spaces.rs'] }, selectDelivery).output, 'vscode_release_affected=true\n')
})

test('a release delivers the editor when the served revision is unproven, even without a valid push range', () => {
  for (const range of [true, false]) {
    const unproven = run({ full: true, range, release: true, planned: '2.1.1' }, selectDelivery)
    assert.equal(unproven.output, 'vscode_release_affected=true\n')
    assert.deepEqual(unproven.queries, [])
    assert.deepEqual(unproven.git, [])
  }
  assert.throws(() => selection({ full: true, range: true, release: true, planned: '2.1.1', lookupFailure: true }, selectDelivery),
    /Simulated lookup failure/)
})

test('a push that plans no npm release publishes no editor and reads no store', () => {
  const unplanned = run({ full: true, range: true, release: true, vscode: true, changed: ['crates/mastercss-lexer/src/lib.rs'] }, selectDelivery)
  assert.equal(unplanned.output, 'vscode_release_affected=false\n')
  assert.deepEqual([unplanned.node, unplanned.queries, unplanned.git], [[], [], []])
  const steps = workflow.jobs.editor_delivery.steps
  const plan = steps.findIndex(step => step.id === 'plan')
  assert.equal(steps[plan].if, '${{ inputs.release_build }}')
  assert.equal(steps[plan].run, 'node scripts/release.mjs --dry-run --github-output')
  const delivery = steps.findIndex(step => step.id === 'delivery')
  assert.ok(plan < delivery)
  assert.equal(steps[delivery].env.RELEASE_BUILD, '${{ inputs.release_build }}')
  assert.equal(steps[delivery].env.RELEASE_VERSION, '${{ steps.plan.outputs.version }}')
})

test('editor delivery is selected without waiting for quality-linux', () => {
  const delivery = workflow.jobs.editor_delivery
  assert.equal(delivery.needs, 'preflight')
  assert.equal(workflow.jobs.editor_evidence.needs, 'editor_delivery')
  assert.equal(workflow.on.workflow_call.outputs.vscode_release_affected.value, '${{ jobs.editor_delivery.outputs.vscode_release_affected }}')
  assert.equal(workflow.jobs.quality_linux.steps.some(step => step.id === 'delivery'), false)
})

function prune({ caches = [], listFailure = false, deleteFailure = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'master-cache-prune-'))
  try {
    const deleted = join(root, 'deleted')
    writeFileSync(deleted, '')
    // Stand in for the GitHub CLI: list this ref's caches newest first, record deletions.
    writeFileSync(join(root, 'gh'), `#!/usr/bin/env bash
if [ "$2" = -X ]; then printf '%s\\n' "$4" >> "$DELETED"; [ "$DELETE_FAILURE" != true ]; exit; fi
if [ "$LIST_FAILURE" = true ]; then echo 'Simulated list failure' >&2; exit 1; fi
printf '%s' "$CACHES"
`, { mode: 0o755 })
    const result = spawnSync('bash', ['-c', workflow.jobs.turbo_cache_prune.steps.find(step => step.id === 'prune').run], {
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, DELETED: deleted, GITHUB_REPOSITORY: 'master-co/css',
        CACHE_REF: 'refs/heads/main', CACHES: caches.map(([id, key]) => `${id}\t${key}\n`).join(''),
        LIST_FAILURE: String(listFailure), DELETE_FAILURE: String(deleteFailure) },
      encoding: 'utf8'
    })
    assert.equal(result.status, 0, result.stderr)
    return { stdout: result.stdout, deleted: readFileSync(deleted, 'utf8').split('\n').filter(Boolean) }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('cache pruning keeps the newest Turbo cache of each scope and every other cache', () => {
  const caches = [[1, 'Linux-X64-bun-1.4.4-turbo-build-main-300'], [2, 'Linux-X64-bun-1.4.4-3d224cac'],
    [3, 'Windows-X64-bun-1.4.4-turbo-compat-main-300'], [4, 'Linux-X64-bun-1.4.4-turbo-build-main-200'],
    [5, 'v0-rust-native-binding-linux-x64-gnu-Linux-x64-41224fa4-ea3c0cbd'], [6, 'Windows-X64-bun-1.4.4-turbo-compat-main-200'],
    [7, 'Linux-X64-bun-1.4.4-turbo-e2e-main-100'], [8, 'Linux-X64-bun-1.4.4-turbo-build-main-100']]
  assert.deepEqual(prune({ caches }).deleted, [4, 6, 8].map(id => `repos/master-co/css/actions/caches/${id}`))
  assert.equal(prune({ caches, deleteFailure: true }).deleted.length, 3, 'one failed deletion does not stop the rest')
})

test('cache pruning is skipped for pull requests and never fails validation', () => {
  const job = workflow.jobs.turbo_cache_prune
  assert.deepEqual(job.permissions, { 'actions': 'write' })
  assert.equal(job.if, '${{ always() && github.event_name != \'pull_request\' }}')
  const failed = prune({ caches: [[1, 'Linux-X64-bun-1.4.4-turbo-build-main-2'], [2, 'Linux-X64-bun-1.4.4-turbo-build-main-1']], listFailure: true })
  assert.deepEqual(failed.deleted, [])
})
