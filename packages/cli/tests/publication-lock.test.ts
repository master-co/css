import fs from 'node:fs'
import { rename, unlink } from 'node:fs/promises'
import { platform, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { withStylesheetPublicationLock } from '../src/publication-lock'

vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>()
  return { ...actual, rename: vi.fn(actual.rename), unlink: vi.fn(actual.unlink) }
})
vi.mock('node:os', async (original) => {
  const actual = await original<typeof import('node:os')>()
  return { ...actual, platform: vi.fn(() => 'win32') }
})

afterEach(() => { vi.resetAllMocks() })

test('a sharing violation keeps the choosing register visible and excludes a waiting publisher', async () => {
  const directory = fs.mkdtempSync(join(tmpdir(), 'master-css-lock-sharing-'))
  const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  let blocked = ''
  let release!: () => void
  let ready!: () => void
  const entered = new Promise<void>(resolve => { ready = resolve })
  const held = new Promise<void>(resolve => { release = resolve })
  const order: string[] = []
  vi.mocked(rename).mockImplementation(async (from, to) => {
    const next = JSON.parse(fs.readFileSync(from, 'utf8'))
    if (!next.choosing && !blocked) {
      blocked = String(to)
      expect(JSON.parse(fs.readFileSync(to, 'utf8')).choosing).toBe(true)
      throw Object.assign(new Error('reader still holds the register'), { code: 'EPERM' })
    }
    await actual.rename(from, to)
  })
  const first = withStylesheetPublicationLock(async () => { order.push('first'); ready(); await held }, { directory })
  let second: Promise<void> | undefined
  try {
    await entered
    expect(blocked).not.toBe('')
    second = withStylesheetPublicationLock(() => { order.push('second') }, { directory })
    await expect(withStylesheetPublicationLock(() => { throw new Error('must not enter') }, { directory, timeout: 40 })).rejects.toThrow('Timed out')
    expect(order).toEqual(['first'])
    release()
    await Promise.all([first, second])
    expect(order).toEqual(['first', 'second'])
    expect(fs.readdirSync(directory)).toEqual([])
  } finally { release(); await Promise.allSettled([first, second]); fs.rmSync(directory, { recursive: true, force: true }) }
})

test('transient Windows sharing violations do not leave a live owner register after cleanup', async () => {
  const directory = fs.mkdtempSync(join(tmpdir(), 'master-css-lock-cleanup-'))
  vi.mocked(unlink).mockRejectedValueOnce(Object.assign(new Error('reader holds the register'), { code: 'EACCES' }))
  try {
    await withStylesheetPublicationLock(() => {}, { directory })
    expect(fs.readdirSync(directory)).toEqual([])
    await expect(withStylesheetPublicationLock(() => 'next', { directory, timeout: 100 })).resolves.toBe('next')
  } finally { fs.rmSync(directory, { recursive: true, force: true }) }
})

for (const scenario of ['persistent-sharing', 'other-error', 'non-windows'] as const) {
  test(`a ${scenario} rename failure never enters the publication or leaves its ticket`, async () => {
    const directory = fs.mkdtempSync(join(tmpdir(), 'master-css-lock-error-'))
    const error = Object.assign(new Error('injected rename failure'), { code: scenario === 'other-error' ? 'EIO' : 'EPERM' })
    if (scenario === 'non-windows') vi.mocked(platform).mockReturnValue('linux')
    vi.mocked(rename).mockRejectedValue(error)
    const work = vi.fn()
    try {
      await expect(withStylesheetPublicationLock(work, { directory, timeout: 40 })).rejects.toBe(error)
      expect(work).not.toHaveBeenCalled()
      expect(fs.readdirSync(directory)).toEqual([])
      if (scenario !== 'persistent-sharing') expect(rename).toHaveBeenCalledTimes(1)
    } finally { fs.rmSync(directory, { recursive: true, force: true }) }
  })
}
