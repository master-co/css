import { once } from 'node:events'
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const cli = fileURLToPath(new URL('../src/bin/index.ts', import.meta.url))
const tsconfig = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))
const image = (color: string) => `<svg xmlns="http://www.w3.org/2000/svg"><path fill="${color}"/></svg>`

for (const mode of ['deleted-resource', 'deleted-import', 'new-resource', 'new-import', 'initial-resource', 'initial-import'] as const) {
  test(`BH-0004 CLI watch recovers ${mode} without restart`, async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-watch-recovery-'))
    const entry = join(cwd, 'entry.css')
    const imported = join(cwd, 'child.css')
    const resource = join(cwd, 'image.svg')
    const initialCSS = ".example{color:red;background-image:url('./image.svg')}"
    writeFileSync(entry, mode === 'initial-import' ? "@import './new/nested.css';@master entry;" : "@import './child.css';@master entry;")
    writeFileSync(imported, initialCSS)
    writeFileSync(join(cwd, 'index.html'), '<div class="example block"></div>')
    if (mode !== 'initial-resource') writeFileSync(resource, image('red'))
    const child = spawn(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--watch', '--output', 'dist/output.css', '--verbose', '0'], { cwd, env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig } })
    let stderr = ''
    child.stderr.on('data', chunk => { stderr += chunk })
    child.stdout.resume()
    const wait = async (check: () => boolean) => {
      const deadline = Date.now() + 8000
      while (!check() && child.exitCode === null && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25))
      expect(check(), stderr).toBe(true)
      expect(child.exitCode, stderr).toBeNull()
    }
    const output = () => Object.fromEntries(readdirSync(join(cwd, 'dist')).map(file => [file, readFileSync(join(cwd, 'dist', file)).toString('base64')]))
    const css = () => readdirSync(join(cwd, 'dist')).filter(file => file.endsWith('.css')).map(file => readFileSync(join(cwd, 'dist', file), 'utf8')).join('\n')
    try {
      let before: ReturnType<typeof output> | undefined
      if (!mode.startsWith('initial-')) {
        await wait(() => stderr.includes('Start watching source changes'))
        before = output()
        if (mode === 'deleted-resource') rmSync(resource)
        if (mode === 'deleted-import') rmSync(imported)
        if (mode === 'new-resource') writeFileSync(imported, ".example{color:blue;background-image:url('./new/nested.svg')}")
        if (mode === 'new-import') writeFileSync(imported, "@import './new/nested.css';.example{color:blue}")
      }
      await wait(() => stderr.includes('Cannot rebuild CSS:'))
      if (before) expect(output()).toEqual(before)
      const errors = (stderr.match(/Cannot rebuild CSS:/g) || []).length
      writeFileSync(join(cwd, 'index.html'), '<div class="example block fg-blue"></div>')
      await wait(() => (stderr.match(/Cannot rebuild CSS:/g) || []).length > errors)
      if (before) expect(output()).toEqual(before)
      const restartCount = (stderr.match(/Restart watching source changes/g) || []).length
      if (mode === 'deleted-import') writeFileSync(imported, '.example{color:blue}')
      else if (mode === 'new-import' || mode === 'initial-import') { mkdirSync(join(cwd, 'new')); writeFileSync(join(cwd, 'new/nested.css'), '.example{background-color:lime}') }
      else if (mode === 'new-resource') { mkdirSync(join(cwd, 'new')); writeFileSync(join(cwd, 'new/nested.svg'), image('blue')) }
      else writeFileSync(resource, image('blue'))
      await wait(() => (stderr.match(/Restart watching source changes/g) || []).length > restartCount)
      if (mode === 'deleted-import' || mode === 'new-import' || mode === 'new-resource') expect(css()).toMatch(/color:\s*(?:#00f|blue)\b/)
      if (mode === 'new-import') expect(css()).toMatch(/background-color:\s*(?:#0f0|lime)\b/)
      if (mode.includes('resource')) expect(readdirSync(join(cwd, 'dist')).some(file => file.endsWith('.svg') && readFileSync(join(cwd, 'dist', file), 'utf8') === image('blue'))).toBe(true)
      expect(readFileSync(join(cwd, 'dist/output.css'), 'utf8')).toContain('.fg-blue')
      // A later app edit must still be scanned after recovery.
      writeFileSync(join(cwd, 'index.html'), '<div class="example block fg-red"></div>')
      await wait(() => readFileSync(join(cwd, 'dist/output.css'), 'utf8').includes('.fg-red'))
      const settled = (stderr.match(/Restart watching source changes/g) || []).length
      await new Promise(resolve => setTimeout(resolve, 250))
      expect((stderr.match(/Restart watching source changes/g) || []).length).toBe(settled)
    } finally {
      if (child.exitCode === null) {
        const exited = once(child, 'exit'); child.kill('SIGTERM')
        const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
        await exited; clearTimeout(timer)
      }
      rmSync(cwd, { recursive: true, force: true })
    }
  }, 30000)
}
