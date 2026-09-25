import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mcpEditorial } from '../reference/mcp-editorial'
import { connect, value } from './mcp-stdio'

export async function verifyToolContractExamples() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-doc-contract-')))
  mkdirSync(join(root, 'src'))
  const file = join(root, 'src/button.html')
  const source = '<button class="bg-blue-60 p-md flex gap-sm">Save</button>'
  writeFileSync(file, source)
  writeFileSync(join(root, 'app.css'), '@import "@master/css";\n@theme { --color-brand: blue; }')
  const connection = await connect(root)
  const reports: Record<string, any> = {}
  try {
    const tools = await connection.request<{ tools: { name: string }[] }>('tools/list')
    assert.deepEqual(Object.keys(mcpEditorial).sort(), tools.tools.map(tool => tool.name).sort())
    for (const [name, editorial] of Object.entries(mcpEditorial)) {
      if (name === 'mastercss_apply_preview') continue
      const report = value<any>(await connection.call(name, editorial.example))
      reports[name.replace('mastercss_', '')] = report
      assert.equal(readFileSync(file, 'utf8'), source, `${name} must not change source`)
    }
    assert.equal(reports.workspace_info.root, root)
    assert.ok(reports.workspace_info.manifest.entries.includes(join(root, 'app.css')))
    assert.equal(reports.setup_audit.status, 'warning')
    assert.ok(reports.setup_audit.diagnostics.some((d: any) => d.code === 'missing-master-css-package'))
    assert.equal(reports.inspect_class.matchStatus, 'matched')
    assert.match(reports.inspect_class.css, /padding:var\(--spacing-md\)/)
    assert.equal(reports.trace_class.status, 'present')
    assert.equal(reports.trace_class.detected, true)
    assert.deepEqual(reports.extract_classes.files[0].classes.map((item: any) => item.token), ['flex', 'gap-sm', 'p-md'])
    assert.equal(reports.extract_classes.inputs.mode, 'content')
    assert.equal(reports.inspect_directives.status, 'ok')
    assert.equal(reports.inspect_directives.directiveEntries[0].name, 'theme')
    assert.deepEqual(reports.render_css.classes, ['flex', 'gap-sm'])
    assert.match(reports.render_css.css.text, /display:flex/)
    assert.deepEqual(reports.scan_project.missingCSS.missing, [])
    assert.ok(reports.scan_project.missingCSS.present.some((item: any) => item.className === 'p-md'))
    assert.equal(reports.manifest_query.results.tokens[0].name, 'color-brand')
    assert.equal(reports.manifest_query.summary.returned, 1)
    assert.deepEqual(reports.css_compare.classes, { added: ['p-md'], removed: ['p-sm'], unchanged: [] })
    assert.ok(reports.css_compare.css.changed)
    for (const name of ['lint_project', 'lint_content']) {
      assert.equal(reports[name].summary.warnings, 1)
      assert.equal(reports[name].files[0].diagnostics[0].ruleId, 'sort-classes')
    }
    assert.equal(reports.suggest_syntax.completions.length, 5)
    assert.ok(reports.suggest_syntax.total > 5)
    assert.equal(reports.preview_directive_format.formatted, '.card {\n  @compose background-color:transparent!;\n}')
    assert.equal(reports.preview_directive_format.preview, undefined)
    for (const name of ['repo_context', 'change_impact', 'test_router', 'package_graph']) assert.equal(reports[name].status, 'limited')
    const preview = reports.preview_fixes.preview
    assert.equal(preview.changes.length, 1)
    assert.ok(preview.confirmToken)
    assert.ok(preview.changes[0].diff.includes('-' + source))
    const applied = value<any>(await connection.call('mastercss_apply_preview', { ...mcpEditorial.mastercss_apply_preview.example, confirmToken: preview.confirmToken }))
    assert.equal(applied.applied, true)
    assert.equal(readFileSync(file, 'utf8'), '<button class="flex gap-sm p-md bg-blue-60">Save</button>')
  } finally { await connection.close(); rmSync(root, { recursive: true, force: true }) }
  // Contributor requests read this actual repository; no preview or write tool is called here.
  const repo = fileURLToPath(new URL('../../', import.meta.url))
  const contributor = await connect(repo)
  try {
    for (const short of ['repo_context', 'change_impact', 'test_router', 'package_graph']) {
      const name = `mastercss_${short}`
      const report = value<any>(await contributor.call(name, mcpEditorial[name].example))
      assert.equal(report.status, 'loaded', name)
      if (short === 'package_graph') assert.ok(report.packages.some((item: any) => item.name === 'site'))
      else assert.ok(report.affectedPackages.some((item: any) => item.name === 'site'))
      if (short === 'repo_context') assert.ok(report.context.files.includes('site/AI.md'))
      if (short === 'test_router') assert.ok(report.validation.commands.length)
    }
  } finally { await contributor.close() }
}
