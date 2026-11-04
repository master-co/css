import { mkdtempSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { createDependencyRebuild } from '../../src/dependency-rebuild'

vi.mock('node:fs', async (original) => {
  const fs = await original<typeof import('node:fs')>()
  return { ...fs, statSync: vi.fn(fs.statSync) }
})

const roots: string[] = []
const resource = () => {
  const root = mkdtempSync(join(tmpdir(), 'master-cli-481-'))
  roots.push(root)
  const file = join(root, 'image.svg')
  writeFileSync(file, 'red')
  return file
}
const gate = () => {
  let release!: () => void
  const promise = new Promise<void>(resolve => { release = resolve })
  return { promise, release }
}
afterEach(() => {
  vi.mocked(statSync).mockReset()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

test('two notifications queued before resource publication rebuild the same version once', async () => {
  const file = resource()
  const entered = gate()
  const publish = gate()
  const delivered: string[] = []
  const rebuild = createDependencyRebuild(async () => {
    const bytes = readFileSync(file, 'utf8')
    entered.release()
    await publish.promise
    delivered.push(bytes)
  }, () => true)
  writeFileSync(file, 'blue')
  const first = rebuild(file)
  await entered.promise
  const duplicate = first.then(() => rebuild(file))
  publish.release()
  await duplicate
  expect(delivered).toEqual(['blue'])
})

test('a real resource edit during a pending rebuild is published by the queued notification', async () => {
  const file = resource()
  const entered = gate()
  const publish = gate()
  const delivered: string[] = []
  const rebuild = createDependencyRebuild(async () => {
    const bytes = readFileSync(file, 'utf8')
    entered.release()
    await publish.promise
    delivered.push(bytes)
  }, () => true)
  const first = rebuild(file)
  await entered.promise
  writeFileSync(file, 'blue')
  const second = first.then(() => rebuild(file))
  publish.release()
  await second
  expect(delivered).toEqual(['red', 'blue'])
})

test('deletion and recreation remain separate dependency versions', async () => {
  const file = resource()
  const delivered: (string | undefined)[] = []
  const rebuild = createDependencyRebuild(async () => {
    try { delivered.push(readFileSync(file, 'utf8')) } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      delivered.push(undefined)
    }
  }, () => true)
  await rebuild(file)
  unlinkSync(file)
  await rebuild(file)
  await rebuild(file)
  writeFileSync(file, 'red')
  await rebuild(file)
  expect(delivered).toEqual(['red', undefined, undefined, 'red'])
})

test('content changes are not lost when filesystem timestamps and size are unchanged', async () => {
  const file = resource()
  const stat = statSync(file, { bigint: true })
  vi.mocked(statSync).mockReturnValue(stat)
  const delivered: string[] = []
  const rebuild = createDependencyRebuild(async () => { delivered.push(readFileSync(file, 'utf8')) }, () => true)
  await rebuild(file)
  writeFileSync(file, 'tan')
  await rebuild(file)
  expect(delivered).toEqual(['red', 'tan'])
})

test('successful deletion invalidates the previous version before identical recreation', async () => {
  const file = resource()
  vi.mocked(statSync).mockReturnValue(statSync(file, { bigint: true }))
  const delivered: (string | undefined)[] = []
  const rebuild = createDependencyRebuild(async () => {
    try { delivered.push(readFileSync(file, 'utf8')) } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      delivered.push(undefined)
    }
  }, () => true)
  await rebuild(file)
  unlinkSync(file)
  await rebuild(file)
  writeFileSync(file, 'red')
  await rebuild(file)
  expect(delivered).toEqual(['red', undefined, 'red'])
})

test('failed rebuilds can retry the same resource version', async () => {
  const file = resource()
  let attempts = 0
  const rebuild = createDependencyRebuild(async () => {
    if (++attempts === 1) throw new Error('publication failed')
  }, () => true)
  await expect(rebuild(file)).rejects.toThrow('publication failed')
  await rebuild(file)
  expect(attempts).toBe(2)
})

test('recreating the last successful resource after a failure recovers the invalid pipeline', async () => {
  const file = resource()
  vi.mocked(statSync).mockReturnValue(statSync(file, { bigint: true }))
  let ready = true
  const delivered: string[] = []
  const rebuild = createDependencyRebuild(async () => {
    ready = false
    delivered.push(readFileSync(file, 'utf8'))
    ready = true
  }, () => ready)
  await rebuild(file)
  unlinkSync(file)
  await expect(rebuild(file)).rejects.toMatchObject({ code: 'ENOENT' })
  writeFileSync(file, 'red')
  await rebuild(file)
  expect(ready).toBe(true)
  expect(delivered).toEqual(['red', 'red'])
})

test('disappearance during revision sampling still rebuilds the deleted dependency', async () => {
  const file = resource()
  const before = statSync(file, { bigint: true })
  vi.mocked(statSync).mockImplementationOnce(() => { unlinkSync(file); return before })
  let attempts = 0
  const rebuild = createDependencyRebuild(async () => { attempts++ }, () => true)
  await rebuild(file)
  expect(attempts).toBe(1)
})

test('an invalid pipeline rebuilds even when this dependency was previously completed', async () => {
  const file = resource()
  let ready = true
  let attempts = 0
  const rebuild = createDependencyRebuild(async () => { attempts++ }, () => ready)
  await rebuild(file)
  ready = false
  await rebuild(file)
  expect(attempts).toBe(2)
})
