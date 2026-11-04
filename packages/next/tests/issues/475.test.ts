import { mkdtemp, readFile, rm, stat, unlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, test, vi } from 'vitest'
import { withStaticPublicationLock } from '../../src/static-lock'

vi.mock('node:fs/promises', async importOriginal => {
  const original = await importOriginal<typeof import('node:fs/promises')>()
  return { ...original, stat: vi.fn(original.stat) }
})

afterEach(() => { vi.resetAllMocks() })

test.each(['', '{"pid":', '{}'])('retries acquisition when incomplete owner %j disappears before stat', async owner => {
  const directory = await mkdtemp(join(tmpdir(), 'master-next-lock-disappeared-'))
  const file = join(directory, 'publish.lock')
  const original = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
  const publish = vi.fn(async () => 'published')
  try {
    await writeFile(file, owner)
    vi.mocked(stat).mockImplementationOnce(async (...args) => {
      expect(args[0]).toBe(file)
      // The previous publisher releases after inspection reads its partial JSON.
      await unlink(file)
      return original.stat(...args)
    })
    await expect(withStaticPublicationLock(file, publish)).resolves.toBe('published')
    expect(stat).toHaveBeenCalledTimes(1)
    expect(publish).toHaveBeenCalledTimes(1)
    await expect(readFile(file)).rejects.toMatchObject({ code: 'ENOENT' })
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test.each(['EACCES', 'EIO'])('propagates %s during incomplete-owner inspection without publishing', async code => {
  const directory = await mkdtemp(join(tmpdir(), 'master-next-lock-stat-error-'))
  const file = join(directory, 'publish.lock')
  const error = Object.assign(new Error('Cannot inspect lock'), { code })
  const publish = vi.fn()
  try {
    await writeFile(file, '')
    vi.mocked(stat).mockRejectedValueOnce(error)
    await expect(withStaticPublicationLock(file, publish)).rejects.toBe(error)
    expect(publish).not.toHaveBeenCalled()
    expect(await readFile(file, 'utf8')).toBe('')
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('recovers an abandoned incomplete owner after checking its age under the recovery lock', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'master-next-lock-incomplete-'))
  const file = join(directory, 'publish.lock')
  try {
    await writeFile(file, '')
    const stale = new Date(Date.now() - 60_000)
    await utimes(file, stale, stale)
    await expect(withStaticPublicationLock(file, async () => 'recovered')).resolves.toBe('recovered')
    expect(stat).toHaveBeenCalledTimes(2)
    await expect(readFile(file)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(readFile(`${file}.recovery`)).rejects.toMatchObject({ code: 'ENOENT' })
  } finally { await rm(directory, { recursive: true, force: true }) }
})
