import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'
import { publishOwnedStylesheet, stylesheetStatePath } from '../../src/asset-ownership'

test('485 publication distinguishes physical no-ops, entry repairs and missing assets without overwriting user sidecars', () => {
  const cwd = fs.mkdtempSync(path.join(tmpdir(), 'master-css-485-publication-'))
  const entry = path.join(cwd, 'output.css'), asset = path.join(cwd, 'master-a-probe.css')
  const bytes = Buffer.from('.probe{color:red}'), css = '@import "./master-a-probe.css";'
  const publish = () => publishOwnedStylesheet(entry, css, new Map([[asset, bytes]]), new Set())
  try {
    expect(publish()).toBe(true)
    const physical = () => [entry, asset, stylesheetStatePath(entry)].map(file => {
      const { ino, mtimeNs, size } = fs.statSync(file, { bigint: true })
      return { ino, mtimeNs, size }
    })
    const original = physical()
    expect(publish()).toBe(false)
    expect(physical()).toEqual(original)
    fs.unlinkSync(asset)
    expect(publish()).toBe(true)
    expect(fs.readFileSync(asset)).toEqual(bytes)
    fs.writeFileSync(entry, '/* tampered entry */')
    expect(publish()).toBe(true)
    expect(fs.readFileSync(entry, 'utf8')).toBe(css)
    fs.unlinkSync(entry)
    expect(publish()).toBe(true)
    expect(fs.readFileSync(entry, 'utf8')).toBe(css)
    const target = path.join(cwd, 'linked.css')
    fs.renameSync(entry, target)
    fs.symlinkSync('linked.css', entry)
    expect(publish()).toBe(false)
    fs.writeFileSync(target, '/* tampered symlink target */')
    expect(publish()).toBe(true)
    expect(fs.lstatSync(entry).isSymbolicLink()).toBe(true)
    expect(fs.readFileSync(target, 'utf8')).toBe(css)
    fs.writeFileSync(asset, '/* user-modified immutable asset */')
    expect(publish).toThrow('Refusing to overwrite stylesheet asset')
    expect(fs.readFileSync(asset, 'utf8')).toBe('/* user-modified immutable asset */')
  } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
})

test('485 queued no-op source events stay quiet while physical repairs and real source edits report exports', async () => {
  const cwd = fs.mkdtempSync(path.join(tmpdir(), 'master-css-485-export-events-'))
  const cli = path.resolve(__dirname, '../../src/bin/index.ts')
  const loader = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href
  const env = { ...process.env, TSX_TSCONFIG_PATH: path.resolve(__dirname, '../../../../tsconfig.json') }
  const output = path.join(cwd, 'master.css')
  fs.writeFileSync(path.join(cwd, 'index.html'), '<div class="(display:none)"></div>')
  let child: ReturnType<typeof spawn> | undefined
  try {
    // Repeated one-shot invocations still each report their successful output.
    for (let index = 0; index < 2; index++) {
      const first = spawnSync(process.execPath, ['--import', loader, cli, 'generate', 'index.html'], { cwd, env, encoding: 'utf8' })
      expect(first.status, first.stderr).toBe(0)
      expect(first.stderr.match(/master\.css exported/g)).toHaveLength(1)
    }
    child = spawn(process.execPath, ['--import', pathToFileURL(path.resolve(__dirname, '../fixtures/watch-duplicate-events.mjs')).href,
      '--import', loader, cli, 'generate', '--watch', 'index.html'], { cwd, env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] })
    let stderr = '', reads = 0
    child.stderr!.on('data', chunk => { stderr += chunk })
    child.stdout!.resume()
    child.on('message', message => {
      if ((message as { type?: string }).type === 'publication-entry-read') reads = (message as { count: number }).count
    })
    const exports = () => stderr.match(/master\.css exported/g)?.length ?? 0
    const cssText = () => fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : ''
    const wait = async (check: () => boolean) => {
      const deadline = Date.now() + 10000
      while (!check() && Date.now() < deadline && child!.exitCode === null && child!.signalCode === null) await new Promise(resolve => setTimeout(resolve, 20))
      expect(check(), stderr).toBe(true)
    }
    await wait(() => stderr.includes('Start watching source changes'))
    expect(exports()).toBe(1)
    child.send({ type: 'duplicate-source-events', count: 5 })
    await wait(() => reads >= 5)
    expect(exports(), stderr).toBe(1)
    fs.writeFileSync(output, '/* tampered generated entry */')
    child.send({ type: 'duplicate-source-events', count: 1 })
    await wait(() => cssText().includes('display:none') && exports() === 2)
    fs.writeFileSync(path.join(cwd, 'index.html'), '<div class="(display:block)"></div>')
    await wait(() => cssText().includes('display:block') && exports() === 3)
    await new Promise(resolve => setTimeout(resolve, 300))
    expect(exports(), stderr).toBe(3)
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit')
      child.kill('SIGTERM')
      const kill = setTimeout(() => child!.kill('SIGKILL'), 3000)
      let deadline: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([exited, new Promise<never>((_, reject) => {
          deadline = setTimeout(() => reject(new Error('CLI watcher did not terminate after SIGKILL')), 4000)
        })])
      } finally { clearTimeout(kill); clearTimeout(deadline) }
    }
    fs.rmSync(cwd, { recursive: true, force: true })
  }
}, 30000)
