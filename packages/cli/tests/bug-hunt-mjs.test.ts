import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const cli = fileURLToPath(new URL('../src/bin/index.ts', import.meta.url))
const tsconfig = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))

test.each(['default', 'glob', 'explicit'])('BH-0018 Node CLI discovers .mjs with %s sources', mode => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-mjs-'))
  try {
    writeFileSync(join(cwd, 'entry.mjs'), 'export const classes = "(display:block)"')
    writeFileSync(join(cwd, 'ignored.json'), '{"class":"hidden"}')
    const paths = mode === 'default' ? [] : [mode === 'glob' ? '**/*.mjs' : 'entry.mjs']
    const output = execFileSync(process.execPath, ['--import', pathToFileURL(require.resolve('tsx')).href, cli, 'generate', '--no-export', ...paths], {
      cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig }
    })
    expect(output).toContain(".\\(display\\:block\\){display:block}")
    expect(output).not.toContain(".\\(display\\:none\\){display:none}")
    expect(existsSync(join(cwd, 'master.css'))).toBe(false)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})

test('generate discovers dot-directory sources, skips VCS data and does not follow links', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-dot-sources-'))
  const outside = mkdtempSync(join(tmpdir(), 'master-css-dot-outside-'))
  try {
    mkdirSync(join(cwd, '.vitepress/theme'), { recursive: true })
    writeFileSync(join(cwd, '.vitepress/theme/Layout.vue'), '<template><div class="(display:block)"></div></template>')
    mkdirSync(join(cwd, '.git'), { recursive: true })
    writeFileSync(join(cwd, '.git/index.html'), '<div class="(display:none)"></div>')
    writeFileSync(join(outside, 'a.html'), '<div class="(display:grid)"></div>')
    symlinkSync(outside, join(cwd, 'linked'), 'dir')
    const output = execFileSync(process.execPath, ['--import', pathToFileURL(require.resolve('tsx')).href, cli, 'generate', '--no-export'], {
      cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig }
    })
    expect(output).toContain('.\\(display\\:block\\){display:block}')
    expect(output).not.toContain('display:none')
    expect(output).not.toContain('display:grid')
  } finally {
    rmSync(cwd, { recursive: true, force: true })
    rmSync(outside, { recursive: true, force: true })
  }
})
