import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { YAML } from 'bun'
import { test } from 'bun:test'

const workflow = name => YAML.parse(readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8'))

test('manual release-candidate validation remains read-only and requires the reusable editor gate even with base=head', () => {
  const ci = workflow('ci'), validation = workflow('validation'), editor = workflow('editor-verification')
  assert.equal(ci.on.workflow_dispatch.inputs.release_candidate.type, 'boolean')
  assert.equal(ci.on.workflow_dispatch.inputs.release_candidate.default, false)
  assert.equal(ci.jobs.validation.with.release_build, '${{ github.event_name == \'workflow_dispatch\' && inputs.release_candidate }}')
  assert.deepEqual(Object.keys(ci.jobs).sort(), ['required', 'validation'])
  assert.ok('workflow_call' in editor.on)
  const gate = validation.jobs.editor_evidence
  assert.equal(gate.needs, 'quality_linux')
  assert.equal(gate.if, '${{ inputs.release_build && (github.event_name == \'workflow_dispatch\' || needs.quality_linux.outputs.vscode_release_affected == \'true\') }}')
  assert.equal(gate.uses, './.github/workflows/editor-verification.yml')
  assert.deepEqual(gate.permissions, { contents: 'read' })
  assert.equal(gate.secrets, undefined)
  assert.equal(gate.with, undefined, 'No other revision can be substituted into the nested workflow')
  assert.deepEqual(editor.permissions, { contents: 'read' })
  assert.equal(editor.jobs.required.if, '${{ always() }}')
  assert.deepEqual(editor.jobs.required.needs, ['native', 'package', 'verify'])
  assert.ok(editor.jobs.required.steps[0].run.includes('job.result !== "success"'))
})

test('release publishes only the same-run artifacts whose bytes and all sixteen host proofs passed the gate', () => {
  const release = workflow('release'), editor = workflow('editor-verification')
  assert.equal(release.jobs.release.needs, 'validation')
  assert.equal(release.jobs.validation.with.release_build, true)
  const availability = release.jobs.release.steps.findIndex(step => step.run?.includes('verify-store-availability.mjs'))
  const npm = release.jobs.release.steps.findIndex(step => step.run === 'bun run release')
  assert.ok(availability >= 0 && availability < npm)
  const steps = release.jobs['publish-editors'].steps
  const downloads = steps.filter(step => step.uses?.startsWith('actions/download-artifact@'))
  assert.equal(downloads.length, 2)
  assert.deepEqual(downloads[0].with, { name: 'editor-vsix', path: 'candidate-vsix' })
  assert.deepEqual(downloads[1].with, { pattern: 'editor-proof-*', path: 'editor-proofs', 'merge-multiple': true })
  const check = steps.findIndex(step => step.run?.includes('verify-editor-evidence.mjs'))
  const login = steps.findIndex(step => step.uses?.startsWith('azure/login@'))
  assert.ok(check >= 0 && check < login)
  assert.ok(editor.jobs.required.steps.at(-1).run.includes('verify-editor-evidence.mjs'))
  const shell = steps.map(step => step.run ?? '').join('\n')
  assert.doesNotMatch(shell, /bun run build|vscode:package|vscode:publish|assemble-native-release/)
  assert.match(shell, /--packagePath "\$\{files\[@\]\}"/)
  assert.match(shell, /ovsx@1\.0\.2 publish "\$file"/)
})

test('the real publishing shell passes existing absolute VSIX paths through a workspace cwd change', () => {
  const root = mkdtempSync(join(tmpdir(), 'editor publication fixture '))
  try {
    const bin = join(root, 'bin'), calls = join(root, 'calls')
    mkdirSync(bin)
    mkdirSync(join(root, 'packages/vscode'), { recursive: true })
    for (const publisher of ['masterco', 'master']) {
      mkdirSync(join(root, 'candidate-vsix', publisher), { recursive: true })
      for (let i = 0; i < 8; i++) writeFileSync(join(root, 'candidate-vsix', publisher, `${i}.vsix`), 'fixture')
    }
    // Replace Bun completely: never execute VSCE, OVSX, credentials or a network
    // request. Simulate --filter changing cwd before checking its package paths.
    writeFileSync(join(bin, 'bun'), `#!/usr/bin/env bash
set -euo pipefail
if [ "$1" = run ]; then cd "$GITHUB_WORKSPACE/packages/vscode"; fi
if [[ "$*" == *verify-pat* ]]; then exit 0; fi
count=0
for argument in "$@"; do
  if [[ "$argument" == *.vsix ]]; then
    [[ "$argument" == /* ]]
    test -f "$argument"
    printf '%s\\n' "$argument" >> "$PUBLISH_CALLS"
    count=$((count + 1))
  fi
done
if [ "$1" = run ]; then test "$count" -eq 8; else test "$count" -eq 1; fi
`, { mode: 0o755 })
    const steps = workflow('release').jobs['publish-editors'].steps
    const previousRelativePaths = steps.find(step => step.name === 'Publish VS Code Marketplace extension').run
      .replaceAll('"$GITHUB_WORKSPACE"/candidate-vsix/', 'candidate-vsix/')
    const previous = spawnSync('bash', ['-c', previousRelativePaths], { cwd: root, encoding: 'utf8',
      env: { PATH: `${bin}:${process.env.PATH}`, GITHUB_WORKSPACE: root, PUBLISH_CALLS: calls } })
    assert.notEqual(previous.status, 0, 'The original relative package paths must fail after the workspace cwd change')
    for (const name of ['Publish VS Code Marketplace extension', 'Publish Open VSX extension']) {
      const result = spawnSync('bash', ['-c', steps.find(step => step.name === name).run], { cwd: root, encoding: 'utf8',
        env: { PATH: `${bin}:${process.env.PATH}`, GITHUB_WORKSPACE: root, PUBLISH_CALLS: calls } })
      assert.equal(result.status, 0, result.stderr)
    }
    const paths = readFileSync(calls, 'utf8').trim().split('\n')
    assert.equal(paths.length, 16)
    assert.equal(new Set(paths).size, 16)
    for (const publisher of ['masterco', 'master']) {
      assert.equal(paths.filter(path => path.startsWith(join(root, 'candidate-vsix', publisher) + '/')).length, 8)
    }
  } finally { rmSync(root, { recursive: true, force: true }) }
})
