import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

const cli = resolve(__dirname, '../src/bin/index.ts')
const tsconfig = resolve(__dirname, '../../../tsconfig.json')
const loader = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href

function project(root: string) {
  mkdirSync(root)
  writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'command-options-fixture', type: 'module',
    packageManager: 'bun@1.4.4', dependencies: { next: '*' } }))
  writeFileSync(join(root, 'next.config.mjs'), 'export default {}\n')
  writeFileSync(join(root, 'AGENTS.md'), 'Existing project guidance.\n')
}

function snapshot(root: string, relative = ''): unknown[] {
  return readdirSync(join(root, relative), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const file = join(relative, entry.name)
    const stat = statSync(join(root, file))
    return [{ file, mtime: stat.mtimeMs, content: entry.isDirectory() ? null : readFileSync(join(root, file), 'utf8') },
      ...entry.isDirectory() ? snapshot(root, file) : []]
  })
}

function run(args: string[], cwd: string, env: NodeJS.ProcessEnv = {}) {
  return spawnSync(process.execPath, ['--import', loader, cli, ...args], { cwd, encoding: 'utf8',
    env: { ...process.env, ...env, TSX_TSCONFIG_PATH: tsconfig } })
}

for (const form of ['root', 'add-options-after', 'add-options-before', 'add-cwd-before'] as const) {
  test(`${form} preserves explicit framework and a read-only JSON dry run in the requested cwd`, () => {
    const fixture = mkdtempSync(join(tmpdir(), 'master-css-create-command-options-'))
    const cwd = join(fixture, 'working'), target = join(fixture, 'target')
    project(cwd)
    project(target)
    const flags = ['--framework', 'none', '--dry-run', '--json', '--yes', '--no-install']
    const args = form === 'root' ? [...flags, '--cwd', target]
      : form === 'add-options-after' ? ['add', ...flags, '--cwd', target]
        : form === 'add-options-before' ? [...flags, '--cwd', target, 'add']
          : ['--cwd', target, 'add', ...flags]
    try {
      const before = { cwd: snapshot(cwd), target: snapshot(target) }
      const result = run(args, cwd)
      // Check the filesystem first so a malformed output cannot hide writes.
      expect({ cwd: snapshot(cwd), target: snapshot(target) }, result.stdout + result.stderr).toEqual(before)
      expect(result.status, result.stderr).toBe(0)
      const plan = JSON.parse(result.stdout)
      expect(plan).toMatchObject({ version: 1, root: target, framework: 'none' })
      expect(plan.dependencies.map((dependency: { name: string }) => dependency.name)).toContain('@master/css-cli')
      expect(plan.dependencies.map((dependency: { name: string }) => dependency.name)).not.toContain('@master/css-next')
    } finally { rmSync(fixture, { recursive: true, force: true }) }
  })
}

test('add honors --minimal and --no-install when --yes enables detected installation', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'master-css-create-add-no-install-'))
  const cwd = join(fixture, 'project'), bin = join(fixture, 'bin'), marker = join(fixture, 'install.log')
  project(cwd)
  mkdirSync(bin)
  const shim = join(bin, 'bun.cjs')
  writeFileSync(shim, `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'unexpected install')\n`)
  const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`
  writeFileSync(join(bin, 'bun'), `#!/bin/sh\nexec ${quote(process.execPath)} ${quote(shim)} "$@"\n`)
  writeFileSync(join(bin, 'bun.cmd'), `@echo off\r\n"${process.execPath}" "${shim}" %*\r\n`)
  chmodSync(join(bin, 'bun'), 0o755)
  const envKey = process.platform === 'win32' ? Object.keys(process.env).find(key => key.toLowerCase() === 'path') || 'Path' : 'PATH'
  try {
    const result = run(['add', '--framework', 'none', '--minimal', '--yes', '--no-install'], cwd,
      { [envKey]: `${bin}${delimiter}${process.env[envKey] || ''}` })
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('Master CSS setup complete for none.')
    const packageJSON = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
    expect(packageJSON.dependencies).toMatchObject({ next: '*', '@master/css': 'rc' })
    expect(packageJSON.devDependencies).toEqual({ '@master/css-cli': 'rc' })
    expect(readdirSync(fixture)).not.toContain('install.log')
    expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toBe('Existing project guidance.\n')
    expect(readFileSync(join(cwd, 'next.config.mjs'), 'utf8')).toBe('export default {}\n')
  } finally { rmSync(fixture, { recursive: true, force: true }) }
})
