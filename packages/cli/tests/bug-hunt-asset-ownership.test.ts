import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const cli = fileURLToPath(new URL('../src/bin/index.ts', import.meta.url))
const tsconfig = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))
const run = (cwd: string, output: string) => spawnSync(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--output', output, '--verbose', '0'], { cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig } })

test('BH-0004 CLI records only assets it created and separates output ownership', () => {
  const cwd = fs.mkdtempSync(join(tmpdir(), 'master-css-asset-ownership-'))
  try {
    fs.writeFileSync(join(cwd, 'entry.css'), '@master entry;.example{color:red;background:url(./image.svg)}')
    fs.writeFileSync(join(cwd, 'image.svg'), '<svg/>')
    fs.writeFileSync(join(cwd, 'index.html'), '<div class="example block"></div>')
    const first = run(cwd, 'dist/a.css'); expect(first.status, first.stderr).toBe(0)
    const statePath = join(cwd, 'dist/.a.css.master-css.json')
    expect(fs.existsSync(statePath)).toBe(true)
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    expect(state.entry).toBe('a.css')
    expect(Object.keys(state.owned).sort()).toEqual(state.current.assets.toSorted())
    const before = fs.readFileSync(statePath)
    const second = run(cwd, 'dist/b.css'); expect(second.status, second.stderr).toBe(0)
    const other = JSON.parse(fs.readFileSync(join(cwd, 'dist/.b.css.master-css.json'), 'utf8'))
    expect(other.current.assets.some((file: string) => state.current.assets.includes(file))).toBe(false)
    expect(fs.readFileSync(statePath)).toEqual(before)
    // Existing identical sidecars without ownership metadata are external files.
    fs.unlinkSync(statePath)
    const repeat = run(cwd, 'dist/a.css'); expect(repeat.status, repeat.stderr).toBe(0)
    expect(JSON.parse(fs.readFileSync(statePath, 'utf8')).owned).toEqual({})
  } finally { fs.rmSync(cwd, { recursive: true, force: true }) }
})
