import { linkSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import Context from '../src/context'
import { withPreviewWriteLock } from '../src/preview-write-lock'

const roots: string[] = []
const contexts: Context[] = []
function setup() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'mastercss-preview-race-')))
  roots.push(root)
  const context = new Context({ root })
  contexts.push(context)
  return { root, context }
}
afterEach(() => {
  for (const context of contexts.splice(0)) context.dispose()
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
})

it('accepts exactly one simultaneous use of a preview token', async () => {
  const { root, context } = setup()
  const filePath = join(root, 'a.txt')
  writeFileSync(filePath, 'before')
  const preview = await context.createPreview([{ filePath, afterText: 'after' }])
  const results = await Promise.allSettled(Array.from({ length: 20 }, () => context.applyPreview(preview.confirmToken!)))
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(readFileSync(filePath, 'utf8')).toBe('after')
  await expect(context.applyPreview(preview.confirmToken!)).rejects.toThrow(/already applied/)
})

it.each(['existing', 'new', 'hardlink', 'symlink'] as const)('rejects stale competing previews for %s files across contexts', async (kind) => {
  const { root, context } = setup()
  const other = new Context({ root })
  contexts.push(other)
  const filePath = join(root, 'a.txt')
  let alias = filePath
  if (kind !== 'new') writeFileSync(filePath, 'before')
  if (kind === 'hardlink' || kind === 'symlink') {
    alias = join(root, 'alias.txt')
    if (kind === 'hardlink') linkSync(filePath, alias)
    else symlinkSync(filePath, alias)
  }
  const previews = await Promise.all([
    context.createPreview([{ filePath, afterText: 'one' }]),
    other.createPreview([{ filePath: alias, afterText: 'two' }])
  ])
  const results = await Promise.allSettled([context.applyPreview(previews[0].confirmToken!), other.applyPreview(previews[1].confirmToken!)])
  const winner = results.findIndex(result => result.status === 'fulfilled')
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(readFileSync(filePath, 'utf8')).toBe(['one', 'two'][winner])
  const loser = results[1 - winner]
  expect(loser.status === 'rejected' && String(loser.reason)).toMatch(/(?:changed|created) after preview/)
})

it('validates every file before writing when competing multi-file previews use opposite orders', async () => {
  const { root, context } = setup()
  const files = ['a', 'b'].map(name => join(root, name))
  files.forEach(file => writeFileSync(file, 'before'))
  const previews = await Promise.all([
    context.createPreview(files.map(filePath => ({ filePath, afterText: 'one' }))),
    context.createPreview([...files].reverse().map(filePath => ({ filePath, afterText: 'two' })))
  ])
  const results = await Promise.allSettled(previews.map(preview => context.applyPreview(preview.confirmToken!)))
  const winner = results.findIndex(result => result.status === 'fulfilled')
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
  expect(files.map(file => readFileSync(file, 'utf8'))).toEqual(Array(2).fill(['one', 'two'][winner]))
})

it('applies independent files in different roots and releases the gate after a stale error', async () => {
  const setups = [setup(), setup()]
  const files = setups.map(({ root }) => join(root, 'a'))
  files.forEach(file => writeFileSync(file, 'before'))
  const previews = await Promise.all(setups.map(({ context }, i) => context.createPreview([{ filePath: files[i], afterText: `after-${i}` }])))
  writeFileSync(files[0], 'edited')
  const results = await Promise.allSettled(setups.map(({ context }, i) => context.applyPreview(previews[i].confirmToken!)))
  expect(results.map(result => result.status)).toEqual(['rejected', 'fulfilled'])
  expect(files.map(file => readFileSync(file, 'utf8'))).toEqual(['edited', 'after-1'])
  // A failed apply still permits retry when the original precondition is restored.
  writeFileSync(files[0], 'before')
  await setups[0].context.applyPreview(previews[0].confirmToken!)
  expect(readFileSync(files[0], 'utf8')).toBe('after-0')
})

it.each(['expire', 'dispose'] as const)('does not revive a token after %s while waiting', async (action) => {
  const { root, context } = setup()
  const filePath = join(root, 'a')
  writeFileSync(filePath, 'before')
  let release!: () => void
  let entered!: () => void
  const ready = new Promise<void>(resolve => { entered = resolve })
  const held = withPreviewWriteLock(async () => {
    entered()
    await new Promise<void>(resolve => { release = resolve })
  })
  await ready
  try {
    const preview = await context.createPreview([{ filePath, afterText: 'after' }], action === 'expire' ? 30 : undefined)
    const applying = context.applyPreview(preview.confirmToken!)
    const assertion = expect(applying).rejects.toThrow(action === 'expire' ? /expired/ : /already applied/)
    if (action === 'dispose') context.dispose()
    else await new Promise(resolve => setTimeout(resolve, 50))
    release()
    await assertion
    expect(readFileSync(filePath, 'utf8')).toBe('before')
  } finally {
    release()
    await held
  }
})

it('times out a contender without stealing a live lock and releases its own register', async () => {
  const { root } = setup()
  const directory = join(root, 'locks')
  let release!: () => void
  let entered!: () => void
  const ready = new Promise<void>(resolve => { entered = resolve })
  const held = withPreviewWriteLock(async () => {
    entered()
    await new Promise<void>(resolve => { release = resolve })
  }, { directory })
  await ready
  try {
    await expect(withPreviewWriteLock(async () => { throw new Error('must not enter') }, { directory, timeout: 40 })).rejects.toThrow(/Timed out/)
  } finally {
    release()
    await held
  }
  expect(await withPreviewWriteLock(async () => 'available', { directory })).toBe('available')
})
