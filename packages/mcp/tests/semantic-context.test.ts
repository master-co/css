import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { inspectClass, renderCSS } from '../src/scan'
import { loadWorkspaceManifest } from '../src/project'
import { executeTool, jsonToolResult } from '../src/result'

const roots: string[] = []
function project(source?: string) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-final-context-'))
  roots.push(root)
  writeFileSync(join(root, 'package.json'), '{"name":"fixture","private":true}')
  if (source) writeFileSync(join(root, 'index.css'), source)
  return new MasterCSSMCPContext({ root })
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true }) })

it('distinguishes missing entries from failed entries without selecting a preset', async () => {
  const missing = project()
  const failed = project('@master entry; @settings { root-size: 16; }')
  try {
    expect(await loadWorkspaceManifest(missing)).toMatchObject({ status: 'error', reason: 'entry-not-found', context: 'project' })
    expect(await loadWorkspaceManifest(failed)).toMatchObject({ status: 'error', reason: 'entry-load-failed', context: 'project' })
    const result = await executeTool(() => inspectClass(failed, { className: 'block' }))
    expect(result.isError).toBe(true)
    expect(result.structuredContent).toMatchObject({ version: 2, status: 'error', context: 'project' })
    expect(result.content[0]).toEqual({ type: 'text', text: JSON.stringify(result.structuredContent, null, 2) })
  } finally { missing.dispose(); failed.dispose() }
})

it('explicit preset context reports matching separately from validity and browser support', async () => {
  const context = project()
  try {
    const result = await inspectClass(context, { className: 'font:16px', context: 'preset' })
    expect(result).toMatchObject({ matchStatus: 'matched', cssValueStatus: 'invalid', browserSupport: 'not-checked' })
    expect(result.manifest).toMatchObject({ context: 'preset', fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/), versions: { languageVersion: 2, bindingAbiVersion: 9 } })
    const response = jsonToolResult(result)
    expect(JSON.parse((response.content[0] as { text: string }).text)).toEqual(response.structuredContent)
    const rendered = await renderCSS(context, { context: 'preset', classList: 'font:16px width:--space(2)' })
    expect(rendered.css.text).toContain('font:16px')
    expect(rendered.inspections.map(inspection => inspection.cssValueStatus)).toEqual(['invalid', 'unknown'])
    expect(rendered.diagnostics.map(diagnostic => diagnostic.code)).toEqual(['CSS_VALUE_INVALID', 'CSS_VALUE_UNKNOWN'])
  } finally { context.dispose() }
})

it('keeps complete ambiguity alternatives in both structured and JSON output', async () => {
  const context = project('@master entry; @theme { --font-family-brand: Brand; --font-size-brand: 1rem; } @utilities { font-<~font-family> { font-family: --value(); } font-<~font-size> { font-size: --value(); } }')
  try {
    const result = await inspectClass(context, { className: 'font-brand' })
    expect(result.matchStatus).toBe('ambiguous')
    const response = jsonToolResult(result)
    expect(response.structuredContent).toEqual(JSON.parse((response.content[0] as { text: string }).text))
    expect(JSON.stringify(response.structuredContent)).toContain('font-family-brand')
    expect(JSON.stringify(response.structuredContent)).toContain('font-size-brand')
  } finally { context.dispose() }
})
