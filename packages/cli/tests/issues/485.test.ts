import { spawn } from 'node:child_process'
import { once } from 'node:events'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

for (const timing of ['before', 'after'] as const) {
  test(`485 discovers an explicit source authored ${timing} native directory registration`, async () => {
    const cwd = fs.mkdtempSync(path.join(tmpdir(), 'master-css-485-gap-'))
    const output = path.join(cwd, 'master.css')
    const traceRoot = process.env.CLI_WATCH_TRACE_DIR ?? cwd
    fs.mkdirSync(traceRoot, { recursive: true })
    const trace = path.join(traceRoot, `gap-${timing}-${path.basename(cwd)}.jsonl`)
    const require = createRequire(import.meta.url)
    const child = spawn(process.execPath, [
      '--import', pathToFileURL(path.resolve(__dirname, '../fixtures/watch-registration-gap.mjs')).href,
      '--import', pathToFileURL(require.resolve('tsx')).href,
      path.resolve(__dirname, '../../src/bin/index.ts'), 'generate', '--watch', 'pages/only.html'
    ], { cwd, env: { ...process.env, CLI_WATCH_GAP_TIMING: timing, CLI_WATCH_GAP_TRACE: trace,
      TSX_TSCONFIG_PATH: path.resolve(__dirname, '../../../../tsconfig.json') } })
    let stderr = ''
    child.stderr.on('data', chunk => { stderr += chunk })
    const css = () => fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : ''
    const wait = async (check: () => boolean) => {
      const deadline = Date.now() + 10000
      while (!check() && Date.now() < deadline && child.exitCode === null && child.signalCode === null) await new Promise(resolve => setTimeout(resolve, 30))
      expect(check(), stderr + '\n' + (fs.existsSync(trace) ? fs.readFileSync(trace, 'utf8') : '')).toBe(true)
    }
    try {
      await wait(() => stderr.includes('Start watching source changes'))
      fs.mkdirSync(path.join(cwd, 'pages'))
      fs.writeFileSync(path.join(cwd, 'pages/other.html'), '<div class="(display:grid)"></div>')
      await wait(() => stderr.includes(`WATCH_GAP_INJECTED ${timing}`))
      await wait(() => css().includes('.\\(display\\:block\\){display:block}'))
      const events = fs.readFileSync(trace, 'utf8').trim().split('\n').map(line => JSON.parse(line))
      const snapshot = events.findIndex(event => event.kind === 'directory.snapshot')
      const authored = events.findIndex(event => event.kind === 'source.write.end')
      const watching = events.findIndex(event => event.kind === 'native.watch.end' && event.detail.directory === 'pages')
      expect(snapshot).toBeGreaterThanOrEqual(0)
      expect(events[snapshot].detail.names).not.toContain('only.html')
      expect(authored).toBeGreaterThan(snapshot)
      expect(timing === 'before' ? authored < watching : authored > watching).toBe(true)
      fs.writeFileSync(path.join(cwd, 'pages/only.html'), '<div class="(display:none)"></div>')
      await wait(() => css().includes('.\\(display\\:none\\){display:none}'))
      expect(css()).not.toContain('display:grid')
      await new Promise(resolve => setTimeout(resolve, 300))
      const exports = stderr.match(/master\.css exported/g)?.length ?? 0
      await new Promise(resolve => setTimeout(resolve, 300))
      expect(stderr.match(/master\.css exported/g)?.length ?? 0).toBe(exports)
      expect(child.exitCode).toBeNull()
    } finally {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, 'exit')
        child.kill('SIGTERM')
        const timer = setTimeout(() => child.kill('SIGKILL'), 3000)
        let deadline: ReturnType<typeof setTimeout> | undefined
        try {
          await Promise.race([exited, new Promise<never>((_, reject) => {
            deadline = setTimeout(() => reject(new Error('CLI watcher did not terminate after SIGKILL')), 4000)
          })])
        } finally {
          clearTimeout(timer)
          clearTimeout(deadline)
        }
      }
      fs.rmSync(cwd, { recursive: true, force: true })
    }
  }, 30000)
}
