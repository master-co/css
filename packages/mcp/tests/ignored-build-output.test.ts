import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { lintProject } from '../src/lint'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function project() {
  // The native realpath expands Windows 8.3 temp names (RUNNER~1) like the lint does.
  const root = realpathSync.native(mkdtempSync(join(tmpdir(), 'master-css-mcp-ignored-')))
  roots.push(root)
  mkdirSync(join(root, '.git'))
  writeFileSync(join(root, '.gitignore'), 'dist/\n')
  mkdirSync(join(root, 'src'))
  mkdirSync(join(root, 'dist'))
  writeFileSync(join(root, 'src/index.html'), '<div class="block flex"></div>')
  writeFileSync(join(root, 'dist/index.html'), '<div class="flex block"></div>')
  return root
}

it('lints sources without the ignored build output by default', async () => {
  const root = project()
  const report = await lintProject(new MasterCSSMCPContext({ root }), { context: 'preset' })
  expect(report.coverage.checkedFiles.map(file => relative(root, file).split(sep).join('/'))).toEqual(['src/index.html'])
})

it('lints ES modules by default like the CLI', async () => {
  const root = project()
  writeFileSync(join(root, 'src/card.mjs'), 'export const card = "flex block"')
  const report = await lintProject(new MasterCSSMCPContext({ root }), { context: 'preset' })
  expect(report.coverage.checkedFiles.map(file => relative(root, file).split(sep).join('/')).sort()).toEqual(['src/card.mjs', 'src/index.html'])
})

it('lints ignored files that explicit patterns select', async () => {
  const root = project()
  const report = await lintProject(new MasterCSSMCPContext({ root }), { context: 'preset', patterns: ['dist/**/*.html'] })
  expect(report.coverage.checkedFiles.map(file => relative(root, file).split(sep).join('/'))).toEqual(['dist/index.html'])
})
