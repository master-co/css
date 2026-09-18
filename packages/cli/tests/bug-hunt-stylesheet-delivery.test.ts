import { once } from 'node:events'
import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const cli = fileURLToPath(new URL('../src/bin/index.ts', import.meta.url))
const tsconfig = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))

test('BH-0004 CLI emits a referenced resource and native compose without emitting reference CSS', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-delivery-reference-'))
  try {
    mkdirSync(join(cwd, 'tokens'))
    writeFileSync(join(cwd, 'entry.css'), "@reference './tokens/theme.css';@master entry;.example{@compose paint;}")
    writeFileSync(join(cwd, 'tokens/theme.css'), "@utilities{paint{color:red;background-image:url('./icon%23one.svg?q=1#mark')}}.reference-only{color:blue}")
    const bytes = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>')
    writeFileSync(join(cwd, 'tokens/icon#one.svg'), bytes)
    writeFileSync(join(cwd, 'index.html'), '<div class="example block">test</div>')
    execFileSync(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--output', 'dist/樣式 main.css', '--verbose', '0'], {
      cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig }
    })
    const files = readdirSync(join(cwd, 'dist'))
    const css = files.filter(file => file.endsWith('.css')).map(file => readFileSync(join(cwd, 'dist', file), 'utf8')).join('\n')
    expect(css).toContain('color:red')
    expect(css).toContain('?q=1#mark')
    expect(css).not.toContain('.reference-only')
    expect(css).not.toContain('@compose')
    expect(css).not.toContain('@reference')
    const resource = files.find(file => file.endsWith('.svg'))
    expect(resource).toBeDefined()
    expect(readFileSync(join(cwd, 'dist', resource!))).toEqual(bytes)
    expect(css).toContain(`./${resource}?q=1#mark`)
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 CLI keeps separate native pruning scopes for shared imports', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-delivery-pruning-'))
  try {
    writeFileSync(join(cwd, 'a.css'), "@import './shared.css' print;@master entry;@preserve native;")
    writeFileSync(join(cwd, 'b.css'), "@import './shared.css' screen;@master entry;")
    writeFileSync(join(cwd, 'shared.css'), '.unscanned{color:red}')
    writeFileSync(join(cwd, 'index.html'), '<div class="block">test</div>')
    execFileSync(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--output', 'dist/output.css', '--verbose', '0'], {
      cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig }
    })
    const css = readdirSync(join(cwd, 'dist')).filter(file => file.endsWith('.css')).map(file => readFileSync(join(cwd, 'dist', file), 'utf8'))
    expect(css.filter(text => text.includes('.unscanned'))).toHaveLength(1)
    expect(css.some(text => text.includes('print'))).toBe(true)
    expect(css.some(text => text.includes('screen'))).toBe(true)
  } finally { rmSync(cwd, { recursive: true, force: true }) }
})

test('BH-0004 CLI watch republishes changed resources and ignores its output files', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-delivery-watch-'))
  writeFileSync(join(cwd, 'entry.css'), "@master entry;.example{background-image:url('./image.svg')}")
  writeFileSync(join(cwd, 'index.html'), '<div class="example block">test</div>')
  writeFileSync(join(cwd, 'image.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><path fill="red"/></svg>')
  const child = spawn(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--watch', '--output', 'dist/output.css', '--verbose', '0'], {
    cwd, env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig }
  })
  let stderr = ''
  child.stderr.on('data', chunk => { stderr += chunk })
  child.stdout.resume()
  const wait = async (check: () => boolean) => {
    const deadline = Date.now() + 10000
    while (!check() && Date.now() < deadline && child.exitCode === null) await new Promise(resolve => setTimeout(resolve, 30))
    expect(check(), stderr).toBe(true)
  }
  try {
    await wait(() => stderr.includes('Start watching source changes'))
    const before = readdirSync(join(cwd, 'dist')).find(file => file.endsWith('.svg'))!
    const updated = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="blue"/></svg>'
    writeFileSync(join(cwd, 'image.svg'), updated)
    await wait(() => stderr.includes('Restart watching source changes'))
    const after = readdirSync(join(cwd, 'dist')).find(file => file.endsWith('.svg') && file !== before)!
    expect(after).toBeDefined()
    expect(readFileSync(join(cwd, 'dist', after), 'utf8')).toBe(updated)
    // Old immutable generations remain available to readers of the previous
    // entry. Inspect only stylesheets reachable from the current entry.
    const visited = new Set<string>()
    const readGraph = (file: string): string => {
      if (visited.has(file)) return ''
      visited.add(file)
      const text = readFileSync(join(cwd, 'dist', file), 'utf8')
      return text + [...text.matchAll(/@import "\.\/([^"]+)"/g)].map(([, href]) => readGraph(decodeURIComponent(href))).join('\n')
    }
    const css = readGraph('output.css')
    expect(css).toContain(after)
    expect(css).not.toContain(before)
    const restarts = stderr.match(/Restart watching source changes/g)?.length
    await new Promise(resolve => setTimeout(resolve, 400))
    expect(stderr.match(/Restart watching source changes/g)?.length).toBe(restarts)
    expect(child.exitCode).toBeNull()
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit')
      child.kill('SIGTERM')
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
      await exited
      clearTimeout(timer)
    }
    rmSync(cwd, { recursive: true, force: true })
  }
}, 30000)
