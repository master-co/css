import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { expect, test } from 'vitest'

for (const scenario of [
  { name: 'default empty project', patterns: [], file: 'pages/nested/new.mjs', excluded: 'node_modules/pkg/skip.html' },
  { name: 'new glob base with negative pattern', patterns: ['pages/**/*.{html,mjs}', '!pages/skip/**'], file: 'pages/nested/new.html', excluded: 'pages/skip/no.html' },
  { name: 'explicit missing source', patterns: ['pages/only.html'], file: 'pages/only.html', excluded: 'pages/other.html' }
]) {
  test(`BH-0019 watches ${scenario.name} without output feedback`, async () => {
    const cwd = mkdtempSync(join(tmpdir(), 'master-css-watch-new-'))
    const output = join(cwd, 'master.css')
    const child = spawn(process.execPath, ['--import', createRequire(import.meta.url).resolve('tsx'),
      resolve(__dirname, '../src/bin/index.ts'), 'generate', '--watch', ...scenario.patterns], {
      cwd, env: { ...process.env, TSX_TSCONFIG_PATH: resolve(__dirname, '../../../tsconfig.json') }
    })
    let stderr = ''
    child.stderr.on('data', chunk => { stderr += chunk })
    child.stdout.resume()
    const css = () => existsSync(output) ? readFileSync(output, 'utf8') : ''
    const wait = async (check: () => boolean) => {
      const deadline = Date.now() + 10000
      while (!check() && Date.now() < deadline && child.exitCode === null) await new Promise(resolveWait => setTimeout(resolveWait, 30))
      expect(check(), stderr).toBe(true)
    }
    const write = (file: string, text: string) => {
      mkdirSync(dirname(join(cwd, file)), { recursive: true })
      writeFileSync(join(cwd, file), text)
    }
    try {
      await wait(() => stderr.includes('Start watching source changes'))
      write(scenario.excluded, '<div class="grid"></div>')
      write('ignored.json', '{"class":"grid"}')
      write(scenario.file, scenario.file.endsWith('.mjs') ? 'export const classes = "block"' : '<div class="block"></div>')
      await wait(() => css().includes('.block{display:block}'))
      write(scenario.file, scenario.file.endsWith('.mjs') ? 'export const classes = "hidden"' : '<div class="hidden"></div>')
      await wait(() => css().includes('.hidden{display:none}'))
      await new Promise(resolveWait => setTimeout(resolveWait, 300))
      expect(css()).not.toContain('.grid{display:grid}')
      const exports = stderr.match(/master\.css exported/g)?.length ?? 0
      await new Promise(resolveWait => setTimeout(resolveWait, 300))
      expect(stderr.match(/master\.css exported/g)?.length ?? 0).toBe(exports)
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
}
