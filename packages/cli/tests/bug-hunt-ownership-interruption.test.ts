import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'
import { publishOwnedStylesheet, stylesheetStatePath } from '../src/asset-ownership'
import { withStylesheetPublicationLock } from '../src/publication-lock'

const require = createRequire(import.meta.url)
const publisher = fileURLToPath(new URL('../src/asset-ownership.ts', import.meta.url))
const lock = fileURLToPath(new URL('../src/publication-lock.ts', import.meta.url))

for (const mode of ['before-assets', 'before-entry', 'after-entry', 'symlink-before-entry'] as const) {
  test(`BH-0004 recovers actual process termination ${mode}`, async () => {
    const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-ownership-interruption-'))
    const entry = join(cwd, 'output.css')
    const linked = mode === 'symlink-before-entry'
    const stage = linked ? 'before-entry' : mode
    const target = linked ? join(cwd, 'target/actual.css') : entry
    const locks = join(cwd, 'locks')
    const assets = new Map([[join(cwd, 'master-a-new.css'), Buffer.from('.new{color:blue}')]])
    const css = '@import "./master-a-new.css";'
    try {
      if (linked) { fs.mkdirSync(join(cwd, 'target')); fs.symlinkSync('target/actual.css', entry) }
      publishOwnedStylesheet(entry, '@import "./master-a-old.css";', new Map([[join(cwd, 'master-a-old.css'), Buffer.from('.old{color:red}')]]), new Set())
      const script = `
        import fs from 'node:fs';
        const { publishOwnedStylesheet } = await import(${JSON.stringify(publisher)});
        const { withStylesheetPublicationLock } = await import(${JSON.stringify(lock)});
        const entry = ${JSON.stringify(entry)};
        const target = ${JSON.stringify(target)};
        const stage = ${JSON.stringify(stage)};
        const rename = fs.renameSync; const link = fs.linkSync;
        fs.linkSync = (from, to) => {
          if (stage === 'before-assets') process.kill(process.pid, 'SIGKILL');
          link(from, to);
        };
        fs.renameSync = (from, to) => {
          if (to === target && stage === 'before-entry') process.kill(process.pid, 'SIGKILL');
          rename(from, to);
          if (to === target && stage === 'after-entry') process.kill(process.pid, 'SIGKILL');
        };
        await withStylesheetPublicationLock(() => publishOwnedStylesheet(entry, ${JSON.stringify(css)}, new Map([[${JSON.stringify(join(cwd, 'master-a-new.css'))}, Buffer.from('.new{color:blue}')]]), new Set()), { directory: ${JSON.stringify(locks)} });
      `
      const child = spawnSync(process.execPath, ['--import', require.resolve('tsx'), '--input-type=module', '-e', script], { encoding: 'utf8' })
      expect(child.signal, child.stderr).toBe('SIGKILL')
      expect(JSON.parse(fs.readFileSync(stylesheetStatePath(entry), 'utf8')).pending).toBeDefined()
      expect(fs.readFileSync(entry, 'utf8')).toContain(stage === 'after-entry' ? 'new' : 'old')
      await withStylesheetPublicationLock(() => publishOwnedStylesheet(entry, css, assets, new Set()), { directory: locks, timeout: 3000 })
      const state = JSON.parse(fs.readFileSync(stylesheetStatePath(entry), 'utf8'))
      expect(state.pending).toBeUndefined()
      expect(state.current.assets).toEqual(['master-a-new.css'])
      expect(state.retained[0].assets).toEqual(['master-a-old.css'])
      expect(fs.readFileSync(join(cwd, 'master-a-new.css'), 'utf8')).toBe('.new{color:blue}')
      expect(fs.readFileSync(join(cwd, 'master-a-old.css'), 'utf8')).toBe('.old{color:red}')
      expect(fs.readdirSync(cwd).some(file => file.endsWith('.tmp'))).toBe(false)
      expect(fs.readdirSync(locks)).toEqual([])
      if (linked) {
        expect(fs.lstatSync(entry).isSymbolicLink()).toBe(true)
        expect(fs.readdirSync(join(cwd, 'target'))).toEqual(['actual.css'])
      }
    } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
  })
}

test('BH-0004 a queued publication times out without stealing a live owner', async () => {
  const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-publication-lock-timeout-'))
  let release!: () => void
  let entered!: () => void
  const ready = new Promise<void>(resolve => { entered = resolve })
  const held = new Promise<void>(resolve => { release = resolve })
  const first = withStylesheetPublicationLock(async () => { entered(); await held }, { directory: cwd })
  try {
    await ready
    await expect(withStylesheetPublicationLock(() => { throw new Error('must not enter') }, { directory: cwd, timeout: 30 })).rejects.toThrow('Timed out')
    expect(fs.readdirSync(cwd)).toHaveLength(1)
  } finally { release(); await first; fs.rmSync(cwd, { recursive: true, force: true }) }
})
