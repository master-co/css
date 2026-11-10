import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { lintProject } from '../src/lint'

const roots: string[] = []
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }) })

function project() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-css-mcp-ignored-')))
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
  expect(report.coverage.checkedFiles.map(file => relative(root, file))).toEqual(['src/index.html'])
})

it('lints ignored files that explicit patterns select', async () => {
  const root = project()
  const report = await lintProject(new MasterCSSMCPContext({ root }), { context: 'preset', patterns: ['dist/**/*.html'] })
  expect(report.coverage.checkedFiles.map(file => relative(root, file))).toEqual(['dist/index.html'])
})
