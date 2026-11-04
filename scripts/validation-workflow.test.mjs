import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { YAML } from 'bun'
import { test } from 'bun:test'

const workflow = YAML.parse(readFileSync(new URL('../.github/workflows/validation.yml', import.meta.url), 'utf8'))
const selectConsumers = workflow.jobs.quality_linux.steps.find(step => step.id === 'consumers').run

function selection({ full, range, site = false, vscode = false, changed = [], queryFailure = false, diffFailure = false }, script = selectConsumers) {
  const root = mkdtempSync(join(tmpdir(), 'master-validation-'))
  try {
    const output = join(root, 'outputs')
    const calls = join(root, 'calls')
    // Exercise the workflow's actual shell control flow. The affected query
    // reports no changes for base=head, as manual full validation commonly has.
    writeFileSync(join(root, 'bun'), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$QUERY_CALLS"
if [ "$QUERY_FAILURE" = true ]; then echo 'Simulated affected query failure' >&2; exit 2; fi
case "$*" in
  *--filter=site*) printf '%s\\n' '{"tasks":${site ? '[{"taskId":"site#build"}]' : '[]'}}' ;;
  *) printf '%s\\n' '{"tasks":${vscode ? '[{"taskId":"@master/css-vscode#build"}]' : '[]'}}' ;;
esac
`, { mode: 0o755 })
    writeFileSync(join(root, 'git'), `#!/usr/bin/env bash
if [ "$DIFF_FAILURE" = true ]; then echo 'Simulated diff failure' >&2; exit 2; fi
printf '%s\\n' "$CHANGED_FILES"
`, { mode: 0o755 })
    const result = spawnSync('bash', ['-c', script], {
      env: { ...process.env, PATH: `${root}:${process.env.PATH}`, GITHUB_OUTPUT: output, QUERY_CALLS: calls,
        FULL_VALIDATION: String(full), RANGE_VALID: String(range), TURBO_SCM_BASE: 'base', TURBO_SCM_HEAD: 'head',
        CHANGED_FILES: changed.join('\n'), QUERY_FAILURE: String(queryFailure), DIFF_FAILURE: String(diffFailure) },
      encoding: 'utf8'
    })
    assert.equal(result.status, 0, result.stderr)
    return readFileSync(output, 'utf8')
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

const selectDelivery = workflow.jobs.quality_linux.steps.find(step => step.id === 'delivery').run

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
