import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const cli = fileURLToPath(new URL('../src/bin/index.ts', import.meta.url))
const tsconfig = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))
const run = (cwd: string) => spawnSync(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--output', 'dist/output.css', '--verbose', '0'], { cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig } })
function prepare(cwd: string, color: string) {
  writeFileSync(join(cwd, 'entry.css'), `@master entry;.example{color:${color};background-image:url('./image.svg')}`)
  writeFileSync(join(cwd, 'image.svg'), `<svg xmlns="http://www.w3.org/2000/svg"><path fill="${color}"/></svg>`)
  writeFileSync(join(cwd, 'index.html'), '<div class="example block"></div>')
}
const snapshot = (directory: string) => Object.fromEntries(readdirSync(directory).map(file => [file, readFileSync(join(directory, file)).toString('base64')]))

test('BH-0004 publication failure preserves every previously published asset', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-publication-permissions-'))
  const directory = join(cwd, 'dist')
  try {
    prepare(cwd, 'red')
    const first = run(cwd); expect(first.status, first.stderr).toBe(0)
    const before = snapshot(directory)
    prepare(cwd, 'blue')
    chmodSync(directory, 0o555)
    const failure = run(cwd)
    expect(failure.status, failure.stderr).not.toBe(0)
    expect(failure.stderr).toMatch(/EACCES|EPERM/)
    expect(snapshot(directory)).toEqual(before)
    chmodSync(directory, 0o755)
    const recovered = run(cwd); expect(recovered.status, recovered.stderr).toBe(0)
    expect(readFileSync(join(directory, 'output.css'), 'utf8')).not.toBe(Buffer.from(before['output.css'], 'base64').toString())
  } finally { chmodSync(directory, 0o755); rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 immutable sidecar collision preserves user-modified files', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-publication-collision-'))
  const directory = join(cwd, 'dist')
  try {
    prepare(cwd, 'red')
    const first = run(cwd); expect(first.status, first.stderr).toBe(0)
    const file = readdirSync(directory).find(file => file !== 'output.css' && file.endsWith('.css'))!
    writeFileSync(join(directory, file), '/* manually modified user file */')
    const before = snapshot(directory)
    const collision = run(cwd)
    expect(collision.status, collision.stderr).not.toBe(0)
    expect(collision.stderr).toContain('Refusing to overwrite stylesheet asset')
    expect(snapshot(directory)).toEqual(before)
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 concurrent CLI publishers reuse complete immutable assets', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-publication-concurrent-'))
  try {
    prepare(cwd, 'red')
    const results = await Promise.all(Array.from({ length: 4 }, async () => {
      const child = spawn(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--output', 'dist/output.css', '--verbose', '0'], { cwd, env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig } })
      let stderr = ''; child.stderr.on('data', bytes => { stderr += bytes }); child.stdout.resume()
      const [status] = await once(child, 'exit')
      return { status, stderr }
    }))
    for (const { status, stderr } of results) expect(status, stderr).toBe(0)
    const before = snapshot(join(cwd, 'dist'))
    const repeat = run(cwd); expect(repeat.status, repeat.stderr).toBe(0)
    expect(snapshot(join(cwd, 'dist'))).toEqual(before)
    expect(Object.keys(before).some(file => file.endsWith('.tmp'))).toBe(false)
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 watch retries a publication failure without changing the previous graph', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-publication-watch-'))
  const directory = join(cwd, 'dist')
  prepare(cwd, 'red')
  const child = spawn(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--watch', '--output', 'dist/output.css', '--verbose', '0'], { cwd, env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig } })
  let stderr = ''; child.stderr.on('data', bytes => { stderr += bytes }); child.stdout.resume()
  const wait = async (check: () => boolean) => {
    const deadline = Date.now() + 8000
    while (!check() && child.exitCode === null && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25))
    expect(check(), stderr).toBe(true)
    expect(child.exitCode, stderr).toBeNull()
  }
  try {
    await wait(() => stderr.includes('Start watching source changes'))
    const before = snapshot(directory)
    chmodSync(directory, 0o555)
    prepare(cwd, 'blue')
    await wait(() => stderr.includes('Cannot rebuild CSS:'))
    expect(stderr).toMatch(/EACCES|EPERM/)
    expect(snapshot(directory)).toEqual(before)
    chmodSync(directory, 0o755)
    writeFileSync(join(cwd, 'index.html'), '<div class="example block fg:blue"></div>')
    await wait(() => stderr.includes('Restart watching source changes'))
    const after = snapshot(directory)
    expect(Buffer.from(after['output.css'], 'base64').toString()).toContain('.fg\\:blue')
    for (const [file, bytes] of Object.entries(before)) if (file !== 'output.css' && !file.endsWith('.master-css.json')) expect(after[file]).toBe(bytes)
    const resets = (stderr.match(/Restart watching source changes/g) || []).length
    await new Promise(resolve => setTimeout(resolve, 300))
    expect((stderr.match(/Restart watching source changes/g) || []).length).toBe(resets)
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit'); child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited; clearTimeout(timer)
    }
    chmodSync(directory, 0o755)
    rmSync(cwd, { recursive: true, force: true })
  }
}, 30000)
