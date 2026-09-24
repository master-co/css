import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { build } from 'vite'
import { expect, test, vi } from 'vitest'
import masterCSS from '../../src/core'
import { watchDeadline } from '../watch-deadline-helper'

async function fixture(mode: 'static' | 'runtime' | 'pre-render' | 'progressive', run: (state: Awaited<ReturnType<typeof setup>>) => Promise<void>, exclude?: string[], managed = false) {
  const state = await setup(mode, exclude, managed)
  try { await run(state) } finally { await state.close();rmSync(state.root, { recursive: true, force: true }) }
}
async function setup(mode: 'static' | 'runtime' | 'pre-render' | 'progressive', exclude?: string[], managed = false, include?: string[]) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-build-recovery-'))), cacheDir = join(root, '.vite')
  const reference = join(root, 'missing/nested/tokens.css'), style = join(root, 'style.css')
  const trace = (kind: string, detail: unknown) => {
    if (process.env.BH_WATCH_TRACE_FILE) appendFileSync(process.env.BH_WATCH_TRACE_FILE, JSON.stringify({ root, mode, managed, at: performance.now(), kind, detail }) + '\n')
  }
  writeFileSync(style, (managed ? '@master entry;' : '') + '@reference "./missing/nested/tokens.css";.target{@compose paint;}')
  writeFileSync(join(root, 'entry.js'), 'import "./style.css"')
  writeFileSync(join(root, 'index.html'), '<div class="target"></div><script type="module" src="./entry.js"></script>')
  const result = await build({ root, cacheDir, configFile: false, logLevel: 'silent', plugins: [masterCSS({ mode }), { name: 'recovery-event-observer', watchChange(id, change) { trace('watch', { id, change });if (process.env.BH_WATCH_TRACE) console.log('WATCH', mode, Date.now(), id, change) } }], build: { watch: { include, exclude }, minify: false } }).catch(error => { rmSync(root, { recursive: true, force: true });throw error })
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
    async next() { await vi.waitFor(() => expect(events.length).toBeGreaterThan(0), { timeout: watchDeadline });return events.shift()! },
    write(text: string) { trace('write', text);mkdirSync(dirname(reference), { recursive: true });writeFileSync(reference, text) },
    cacheFiles() { try { return readdirSync(cacheDir).filter(name => name.startsWith('master-css-watch-')).flatMap(name => readdirSync(join(cacheDir, name)).map(file => join(cacheDir, name, file))) } catch { return [] } },
    output() { return readdirSync(join(root, 'dist'), { recursive: true, withFileTypes: true }).filter(file => file.isFile()).map(file => readFileSync(join(file.parentPath, file.name), 'utf8')).join('\n') },
    async close() { if (!closed) { closed = true;await result.close();await Promise.all(closing) } }
  }
}
for (const managed of [false, true]) for (const mode of ['static', 'runtime', 'pre-render', 'progressive'] as const) {
  test(`build recovery replaces failures and forgets successful dependencies in ${mode} (managed=${managed})`, async () => {
    await fixture(mode, async state => {
      expect((await state.next()).code).toBe('ERROR')
      state.write('@utilities{paint{@compose definitely-missing;}}')
      const invalid = await state.next();expect(invalid.code).toBe('ERROR');expect(String(invalid.error)).toContain('definitely-missing')
      await delay(process.env.BH_WATCH_TRACE ? 2000 : 250);expect(state.events).toEqual([])
      state.write('@utilities{paint{padding:3rem}}')
      expect((await state.next()).code).toBe('BUNDLE_END');expect(state.output()).toContain('padding:3rem')
      writeFileSync(state.style, '.target{padding:4rem}')
      expect((await state.next()).code).toBe('BUNDLE_END');expect(state.output()).toContain('padding:4rem')
      const before = state.cacheFiles().map(file => [file, statSync(file).mtimeMs] as const)
      state.write('@utilities{paint{padding:99rem}}')
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
  await fixture('static', async state => {
    expect((await state.next()).code).toBe('ERROR')
    expect(state.cacheFiles().length).toBeGreaterThan(0)
    await state.close()
    expect(state.cacheFiles()).toEqual([])
    state.write('@utilities{paint{padding:3rem}}')
    await delay(250);expect(state.events).toEqual([])
  })
})

test('build recovery respects excluded dependencies', async () => {
  await fixture('static', async state => {
    expect((await state.next()).code).toBe('ERROR')
    state.write('@utilities{paint{padding:3rem}}')
    await delay(350);expect(state.events).toEqual([])
  }, ['**/tokens.css'])
})

for (const filter of [
  { name: 'authored-file include', include: ['**/*.css', '**/*.js', '**/*.html'] },
  { name: 'cache-directory exclude', exclude: ['**/.vite/**'] }
]) test(`watch filters allow reference recovery with ${filter.name}`, async () => {
  const state = await setup('static', filter.exclude, false, filter.include)
  try {
    expect((await state.next()).code).toBe('ERROR')
    state.write('@utilities{paint{padding:3rem}}')
    expect((await state.next()).code).toBe('BUNDLE_END')
    expect(state.output()).toContain('padding:3rem')
  } finally { await state.close();rmSync(state.root, { recursive: true, force: true }) }
})

test('a watch filter that accepts no recovery location allocates nothing', async () => {
  const state = await setup('static', undefined, false, ['**/*.no-such-extension'])
  try {
    expect((await state.next()).code).toBe('ERROR')
    expect(state.cacheFiles()).toEqual([])
  } finally { await state.close();rmSync(state.root, { recursive: true, force: true }) }
})
