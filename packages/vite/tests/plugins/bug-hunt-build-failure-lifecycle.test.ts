import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { build } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

async function fixture(mode: "static" | 'runtime' | 'pre-render' | 'progressive', run: (state: Awaited<ReturnType<typeof setup>>) => Promise<void>, exclude?: string[], managed = false) {
  const state = await setup(mode, exclude, managed)
  try { await run(state) } finally { await state.close();rmSync(state.root, { recursive: true, force: true }) }
}
async function setup(mode: "static" | 'runtime' | 'pre-render' | 'progressive', exclude?: string[], managed = false, include?: string[], onBuildEnd?: (error: unknown) => Promise<void>) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-build-recovery-'))), cacheDir = join(root, '.vite')
  const reference = join(root, 'missing/nested/tokens.css'), style = join(root, 'style.css')
  const trace = (kind: string, detail: unknown) => {
    if (process.env.BH_WATCH_TRACE_FILE) appendFileSync(process.env.BH_WATCH_TRACE_FILE, JSON.stringify({ root, mode, managed, at: performance.now(), kind, detail }) + '\n')
  }
  writeFileSync(style, (managed ? "@import url(\"@master/css\");" : '') + "@reference \"./missing/nested/tokens.css\";.target{@media all {padding:var(--paint-padding);}}")
  writeFileSync(join(root, 'entry.js'), 'import "./style.css"')
  writeFileSync(join(root, 'index.html'), '<div class="target"></div><script type="module" src="./entry.js"></script>')
  // Exercise actual filesystem changes with a deterministic content watcher.
  const result = await build({ root, cacheDir, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode }), { name: 'recovery-event-observer', transform(code, id) { if (id.endsWith('/style.css')) trace('transformed-style', code) }, watchChange(id, change) { trace('watch', { id, change });if (process.env.BH_WATCH_TRACE) console.log('WATCH', mode, Date.now(), id, change) }, async buildEnd(error) { await onBuildEnd?.(error) } }], build: { watch: { include, exclude, watcher: { usePolling: true, pollInterval: 50, compareContentsForPolling: true } }, minify: false } }).catch(error => { rmSync(root, { recursive: true, force: true });throw error })
  if (!('on' in result)) throw new Error('Expected build watcher')
  const events: { code: string, error?: unknown }[] = [], closing: Promise<void>[] = []
  let terminal: { code: string, error?: unknown } | undefined, closed = false
  result.on('event', event => {
    trace('event', event.code)
    if (process.env.BH_WATCH_TRACE) console.log('EVENT', mode, Date.now(), event.code)
    if (event.code === 'BUNDLE_END') closing.push(event.result.close())
    if (event.code === 'BUNDLE_END' || event.code === 'ERROR') terminal = event
    if (event.code === 'END' && terminal) { events.push(terminal);terminal = undefined }
  })
  return { root, reference, style, events, cacheDir,
    async next(timeout = watchDeadline) { await vi.waitFor(() => expect(events.length).toBeGreaterThan(0), { timeout });return events.shift()! },
    write(text: string) { trace('write', text);mkdirSync(dirname(reference), { recursive: true });writeFileSync(reference, text) },
    cacheFiles() { try { return readdirSync(cacheDir).filter(name => name.startsWith('master-css-watch-')).flatMap(name => readdirSync(join(cacheDir, name)).map(file => join(cacheDir, name, file))) } catch { return [] } },
    output() { return readdirSync(join(root, 'dist'), { recursive: true, withFileTypes: true }).filter(file => file.isFile()).map(file => readFileSync(join(file.parentPath, file.name), 'utf8')).join('\n') },
    async close() { if (!closed) { closed = true;await result.close();await Promise.all(closing) } }
  }
}

const invalidContents = '@contents is only valid inside @mixin'
async function waitForRecoveredBuild(state: Pick<Awaited<ReturnType<typeof setup>>, 'next' | 'output'>) {
  const deadline = Date.now() + watchDeadline
  for (;;) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) throw new Error('The repaired stylesheet did not recover within the watch deadline')
    const event = await state.next(remaining)
    if (event.code === 'ERROR') {
      // Only the preceding invalid fixture may still be finishing. Other errors
      // fail immediately, and repeated old errors cannot reset the deadline.
      expect(String(event.error)).toContain(invalidContents)
      continue
    }
    expect(event.code).toBe('BUNDLE_END')
    expect(state.output()).toContain('padding:3rem')
    return
  }
}

test('a repair waits for the new build when the previous failure is still ending', async () => {
  const releaseFailure = Promise.withResolvers<undefined>()
  let held = false
  const state = await setup('runtime', undefined, false, undefined, async error => {
    if (!held && String(error).includes(invalidContents)) {
      held = true
      await releaseFailure.promise
    }
  })
  try {
    expect((await state.next()).code).toBe('ERROR')
    state.write('.paint{@contents;} .paint{@contents;}')
    await vi.waitFor(() => expect(held).toBe(true), { timeout: watchDeadline })
    // The invalid build has already failed but has not delivered its END event.
    state.write('@theme {--paint-padding:3rem}')
    releaseFailure.resolve(undefined)
    await waitForRecoveredBuild(state)
  } finally {
    releaseFailure.resolve(undefined)
    await state.close()
    rmSync(state.root, { recursive: true, force: true })
  }
})

test('recovery rejects an unexpected build error before a later success can mask it', async () => {
  const next = vi.fn().mockResolvedValueOnce({ code: 'ERROR', error: new Error('Unexpected compiler failure') })
    .mockResolvedValueOnce({ code: 'BUNDLE_END' })
  await expect(waitForRecoveredBuild({ next, output: () => 'padding:3rem' })).rejects.toThrow('Unexpected compiler failure')
  expect(next).toHaveBeenCalledTimes(1)
})

test('repeated previous errors must recover within one original watch deadline', async () => {
  vi.useFakeTimers()
  try {
    const started = Date.now(), output = vi.fn(() => 'padding:3rem')
    const next = vi.fn(async (remaining = watchDeadline) => {
      await new Promise(resolve => setTimeout(resolve, Math.min(100, remaining)))
      return { code: 'ERROR', error: new Error(invalidContents) }
    })
    const pending = expect(waitForRecoveredBuild({ next, output })).rejects.toThrow('did not recover within the watch deadline')
    await vi.advanceTimersByTimeAsync(watchDeadline)
    await pending
    expect(Date.now() - started).toBe(watchDeadline)
    expect(output).not.toHaveBeenCalled()
  } finally { vi.useRealTimers() }
})
for (const managed of [false, true]) for (const mode of ["static", 'runtime', 'pre-render', 'progressive'] as const) {
  test(`build recovery replaces failures and forgets successful dependencies in ${mode} (managed=${managed})`, async () => {
    await fixture(mode, async state => {
      expect((await state.next()).code).toBe('ERROR')
      state.write('.paint{@contents;} .paint{@contents;}')
      const invalid = await state.next();expect(invalid.code).toBe('ERROR');expect(String(invalid.error)).toContain('@contents is only valid inside @mixin')
      // Rolldown's native watcher and the adapter's recovery watcher can both
      // observe this edit. Validate any queued duplicate, then require a quiet
      // window so a continuing recovery loop still fails the test. An empty
      // terminal queue does not rule out a build that has not emitted END yet.
      const queued: typeof state.events = []
      await vi.waitFor(async () => {
        queued.push(...state.events.splice(0))
        await delay(process.env.BH_WATCH_TRACE ? 2000 : 250)
        expect(state.events).toEqual([])
      }, { timeout: watchDeadline })
      for (const event of queued) {
        expect(event.code).toBe('ERROR')
        expect(String(event.error)).toContain('@contents is only valid inside @mixin')
      }
      state.write(`@theme {--paint-padding:3rem}
`)
      await waitForRecoveredBuild(state)
      writeFileSync(state.style, '.target{padding:4rem}')
      expect((await state.next()).code).toBe('BUNDLE_END')
      // Recovery can already have queued a rebuild when this edit arrives.
      // Assert the eventual authored output, not the identity of the next event.
      await vi.waitFor(() => expect(state.output()).toContain('padding:4rem'), { timeout: watchDeadline })
      const before = state.cacheFiles().map(file => [file, statSync(file).mtimeMs] as const)
      state.write(`@theme {--paint-padding:99rem}
`)
      await delay(350)
      for (const [file, mtime] of before) expect(statSync(file).mtimeMs).toBe(mtime)
      // Rolldown retains old watch files even when the next transform omits them.
      // The adapter must stop reconciliation and preserve the current CSS.
      expect(state.events.every(event => event.code === 'BUNDLE_END')).toBe(true)
      await vi.waitFor(() => expect(state.output()).toContain('padding:4rem'), { timeout: watchDeadline })
      expect(state.output()).not.toContain('padding:99rem')
    }, undefined, managed)
  })
}

test('closing a failed build releases its polling and owned cache files', async () => {
  await fixture("static", async state => {
    expect((await state.next()).code).toBe('ERROR')
    expect(state.cacheFiles().length).toBeGreaterThan(0)
    await state.close()
    expect(state.cacheFiles()).toEqual([])
    state.write(`@theme {--paint-padding:3rem}
`)
    await delay(250);expect(state.events).toEqual([])
  })
})

test('build recovery respects excluded dependencies', async () => {
  await fixture("static", async state => {
    expect((await state.next()).code).toBe('ERROR')
    state.write(`@theme {--paint-padding:3rem}
`)
    await delay(350);expect(state.events).toEqual([])
  }, ['**/tokens.css'])
})

for (const filter of [
  { name: 'authored-file include', include: ['**/*.css', '**/*.js', '**/*.html'] },
  { name: 'cache-directory exclude', exclude: ['**/.vite/**'] }
]) test(`watch filters allow reference recovery with ${filter.name}`, async () => {
  const state = await setup("static", filter.exclude, false, filter.include)
  try {
    expect((await state.next()).code).toBe('ERROR')
    state.write(`@theme {--paint-padding:3rem}
`)
    expect((await state.next()).code).toBe('BUNDLE_END')
    expect(state.output()).toContain('padding:3rem')
  } finally { await state.close();rmSync(state.root, { recursive: true, force: true }) }
})

test('a watch filter that accepts no recovery location allocates nothing', async () => {
  const state = await setup("static", undefined, false, ['**/*.no-such-extension'])
  try {
    expect((await state.next()).code).toBe('ERROR')
    expect(state.cacheFiles()).toEqual([])
  } finally { await state.close();rmSync(state.root, { recursive: true, force: true }) }
})
