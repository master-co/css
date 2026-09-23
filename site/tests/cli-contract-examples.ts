import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { once } from 'node:events'
import { cliEditorial } from '../reference/cli-editorial'

const quote = (text: string) => "'" + text.replaceAll("'", "'\\''") + "'"
const bin = fileURLToPath(new URL('../../packages/cli/dist/bin/index.js', import.meta.url))
const command = (source: string) => source.replace('master-css', `${quote(process.execPath)} ${quote(bin)}`)
const source = '<button class="p:md flex">Save</button>'

export async function verifyCLIContractExamples() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-doc-cli-')))
  mkdirSync(join(root, 'src'))
  const file = join(root, 'src/button.html')
  writeFileSync(file, source)
  writeFileSync(join(root, 'app.css'), '@master entry;')
  function run(source: string) {
    // Evaluate only the curated, repository-owned shell examples, in a disposable workspace.
    const result = spawnSync('/bin/sh', ['-c', command(source)], { cwd: root, encoding: 'utf8', timeout: 15000 })
    assert.equal(result.error, undefined)
    return result
  }
  try {
    const [stdout, output, watch] = cliEditorial.generate.examples.map(example => example.command)
    const css = run(stdout)
    assert.equal(css.status, 0, css.stderr)
    assert.match(css.stdout, /display:flex/)
    assert.doesNotMatch(css.stdout, /classes inserted/)
    assert.equal(existsSync(join(root, 'master.css')), false)
    const published = run(output)
    assert.equal(published.status, 0, published.stderr)
    assert.match(published.stderr, /master.css exported/)
    assert.match(published.stdout, /classes inserted/)
    assert.match(readFileSync(join(root, 'master.css'), 'utf8'), /padding:var\(--spacing-md\)/)
    const child = spawn('/bin/sh', ['-c', 'exec ' + command(watch)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    const exit = once(child, 'exit')
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Watcher did not start: ${stderr}`)), 15000)
        child.once('error', error => { clearTimeout(timeout); reject(error) })
        child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Watcher exited (${code}): ${stderr}`)) })
        child.stderr.on('data', data => {
          stderr += data.toString()
          if (/watching/i.test(stderr)) { clearTimeout(timeout); resolve() }
        })
      })
      assert.equal(child.exitCode, null)
    } finally { child.kill(); await exit }
    const [preview, apply, stdin] = cliEditorial.lint.examples.map(example => example.command)
    const dry = run(preview)
    assert.equal(dry.status, 0, dry.stderr)
    assert.equal(JSON.parse(dry.stdout).summary.warnings, 1)
    assert.equal(readFileSync(file, 'utf8'), source)
    const fixed = run(apply)
    assert.equal(fixed.status, 0, fixed.stderr)
    assert.equal(JSON.parse(fixed.stdout).summary.diagnostics, 0)
    assert.equal(readFileSync(file, 'utf8'), '<button class="flex p:md">Save</button>')
    const buffer = run(stdin)
    assert.equal(buffer.status, 0, buffer.stderr)
    assert.equal(JSON.parse(buffer.stdout).summary.warnings, 1)
    assert.equal(readFileSync(file, 'utf8'), '<button class="flex p:md">Save</button>')
    const [inspect, stylish, save] = cliEditorial.inspect.examples.map(example => example.command)
    const inspected = run(inspect)
    assert.equal(inspected.status, 0, inspected.stderr)
    const report = JSON.parse(inspected.stdout)
    assert.equal(report.version, 1)
    assert.match(report.css.text, /display:flex/)
    assert.deepEqual(report.missingCSS.missing, [])
    assert.ok(report.missingCSS.present.some((item: any) => item.className === 'p:md'))
    const text = run(stylish)
    assert.equal(text.status, 0, text.stderr)
    assert.equal(text.stdout, '')
    assert.ok(text.stderr.length)
    const saved = run(save)
    assert.equal(saved.status, 0, saved.stderr)
    assert.equal(saved.stdout, '')
    assert.equal(JSON.parse(readFileSync(join(root, 'inspection.json'), 'utf8')).version, 1)
  } finally { rmSync(root, { recursive: true, force: true }) }
}
