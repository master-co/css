import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, resolve } from 'node:path'
import { expect, test } from 'vitest'
import { repoRoot, resultRoot, sourceHashes } from '../architecture-evaluation/acceptance'

const run = (...args: string[]) => execFileSync(process.execPath, [resolve(repoRoot, 'benchmarks/architecture-evaluation/run.ts'), ...args], { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe' })

test('record retains rejected evidence when a participant deletes an input', () => {
  const experiment = `record-test-${randomUUID()}`
  const folder = resolve(resultRoot, experiment)
  try {
    run('init', experiment)
    const protocolPath = resolve(folder, 'protocol.json')
    const protocol = JSON.parse(readFileSync(protocolPath, 'utf8'))
    protocol.model = { provider: 'test', id: 'test', revision: 'test', harness: 'test', settings: {} }
    protocol.reviewer = 'test'
    protocol.documentationRevision = 'test'
    writeFileSync(protocolPath, JSON.stringify(protocol))
    run('prepare', experiment, 'native-css', 'token-migration', '1')
    const workspace = resolve(folder, 'native-css-token-migration-1')
    run('start', workspace)
    rmSync(resolve(workspace, 'input.css'))
    expect(() => sourceHashes(workspace)).toThrow()
    writeFileSync(resolve(workspace, 'transcript.txt'), 'Participant deleted input.css and stopped.')
    const review = resolve(workspace, 'review.json')
    writeFileSync(review, JSON.stringify({ status: 'blocked', reviewSeconds: 0, repairIterations: 0, toolCalls: 1, findings: [], visualReview: 'not-reviewed', transcript: 'transcript.txt', notes: '' }))
    run('record', workspace, review)
    const result = JSON.parse(readFileSync(resolve(workspace, 'result.json'), 'utf8'))
    expect(result.accepted).toBe(false)
    expect(result.acceptance).toMatchObject({ passed: false, sourceHashes: { 'input.css': null } })
    expect(result.acceptance.error).toContain('input.css')
    expect(result.acceptance.sourceHashes['index.html']).toMatch(/^[a-f0-9]{64}$/)
  } finally { rmSync(folder, { recursive: true, force: true }) }
})

test('trial commands reject symlinks escaping the results directory before writing', () => {
  mkdirSync(resultRoot, { recursive: true })
  const outside = mkdtempSync(resolve(tmpdir(), 'master-evaluation-outside-'))
  const alias = resolve(resultRoot, `alias-${randomUUID()}`)
  try {
    symlinkSync(outside, alias, 'dir')
    for (const command of ['start', 'check']) {
      expect(() => run(command, alias)).toThrow('resolves outside the results directory')
    }
    expect(() => run('init', basename(alias))).toThrow('resolves outside the results directory')
  } finally {
    rmSync(alias, { force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})
