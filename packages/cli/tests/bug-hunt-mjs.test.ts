import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const require = createRequire(import.meta.url)
const cli = fileURLToPath(new URL('../src/bin/index.ts', import.meta.url))
const tsconfig = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))

test.each(['default', 'glob', 'explicit'])('BH-0018 Node CLI discovers .mjs with %s sources', mode => {
  const cwd = mkdtempSync(join(tmpdir(), 'master-css-bh-mjs-'))
  try {
    writeFileSync(join(cwd, 'entry.mjs'), 'export const classes = "block"')
    writeFileSync(join(cwd, 'ignored.json'), '{"class":"hidden"}')
    const paths = mode === 'default' ? [] : [mode === 'glob' ? '**/*.mjs' : 'entry.mjs']
    const output = execFileSync(process.execPath, ['--import', require.resolve('tsx'), cli, 'generate', '--no-export', ...paths], {
      cwd, encoding: 'utf8', env: { ...process.env, TSX_TSCONFIG_PATH: tsconfig }
    })
    expect(output).toContain('.block{display:block}')
    expect(output).not.toContain('.hidden{display:none}')
    expect(existsSync(join(cwd, 'master.css'))).toBe(false)
  } finally {
    rmSync(cwd, { recursive: true, force: true })
  }
})
