import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { inspectClass, renderCSS } from '../src/scan'
import { inspectDirectives } from '../src/directives'
import { loadWorkspaceManifest } from '../src/project'
import { executeTool, jsonToolResult } from '../src/result'
import { queryManifest } from '../src/manifest-query'

const roots: string[] = []
function project(source?: string) {
  const root = mkdtempSync(join(tmpdir(), 'master-css-final-context-'))
  roots.push(root)
  writeFileSync(join(root, 'package.json'), '{"name":"fixture","private":true}')
  if (source) writeFileSync(join(root, 'index.css'), source)
  return new MasterCSSMCPContext({ root })
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { force: true, recursive: true }) })

it('queries only the families loaded by the workspace, including empty namespaces', async () => {
  const context = project('@import "@master/css";@theme {--space-md:1rem}@mixin --pad(--space){padding:var(--space)}@mixin --ink(--color){color:var(--color)}')
  const entry = join(context.root, 'node_modules/@master/css')
  mkdirSync(entry, { recursive: true })
  writeFileSync(join(entry, 'package.json'), '{"name":"@master/css","style":"./index.css"}')
  writeFileSync(join(entry, 'index.css'), '@layer theme,base,defaults,components,utilities;')
  try {
    const result = await queryManifest(context, { kind: 'family' })
    expect(result.version).toBe(5)
    expect(result.results.families).toEqual([
      { type: 'token-family', mixin: '--pad', prefix: 'pad', namespace: 'space', argument: 'value', properties: ['padding'] },
      { type: 'token-family', mixin: '--ink', prefix: 'ink', namespace: 'color', argument: 'value', properties: ['color'] }
    ])
    expect((await queryManifest(context, { kind: 'family', namespace: 'color' })).results.families).toHaveLength(1)
  } finally { context.dispose() }
})

it('distinguishes missing entries from failed entries without selecting a preset', async () => {
  const missing = project()
  const failed = project("@import \"@master/css\"; @settings { root-size: 16; }")
  try {
    expect(await loadWorkspaceManifest(missing)).toMatchObject({ status: 'error', reason: 'entry-not-found', context: 'project' })
    expect(await loadWorkspaceManifest(failed)).toMatchObject({ status: 'error', reason: 'entry-load-failed', context: 'project' })
    const result = await executeTool(() => inspectClass(failed, { className: "display:block" }))
    expect(result.isError).toBe(true)
    expect(result.structuredContent).toMatchObject({ version: 3, result: { status: 'error' }, metadata: { context: 'project', manifestFingerprint: null } })
    expect(result.content[0]).toEqual({ type: 'text', text: JSON.stringify(result.structuredContent, null, 2) })
  } finally { missing.dispose(); failed.dispose() }
})

it('explicit preset context reports matching separately from validity and browser support', async () => {
  const context = project()
  try {
    const result = await inspectClass(context, { className: 'font:16px', context: 'preset' })
    expect(result).toMatchObject({ matchStatus: 'matched', cssValueStatus: 'invalid', browserSupport: 'not-checked' })
    expect(result.manifest).toMatchObject({ context: 'preset', fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/), versions: { languageVersion: 14, bindingAbiVersion: 23 } })
    const response = jsonToolResult(result)
    expect(JSON.parse((response.content[0] as { text: string }).text)).toEqual(response.structuredContent)
    const rendered = await renderCSS(context, { context: 'preset', classList: 'font:16px width:--space(2)' })
    expect(rendered.css.text).toContain('font:16px')
    expect(rendered.inspections.map(inspection => inspection.cssValueStatus)).toEqual(['invalid', 'unknown'])
    expect(rendered.diagnostics.map(diagnostic => diagnostic.code)).toEqual(['CSS_VALUE_INVALID', 'CSS_VALUE_UNKNOWN'])
    const math = await inspectClass(context, { className: 'width:calc(1px|+|1s)', context: 'preset' })
    expect(math.cssValueStatus).toBe('invalid')
    const removed = await inspectClass(context, { className: 'size:20px', context: 'preset' })
    expect(removed.diagnostics?.some(diagnostic => diagnostic.code === 'REMOVED_PRESET_UTILITY')).toBe(true)
  } finally { context.dispose() }
})

it('keeps complete retired-token alternatives in both structured and JSON output', async () => {
  const context = project("@import \"@master/css\"; @theme { --font-family-brand: Brand; --font-size-brand: 1rem; }")
  try {
    const result = await inspectClass(context, { className: 'font-brand' })
    expect(result.matchStatus).toBe('syntax-error')
    const response = jsonToolResult(result)
    expect(response.structuredContent).toEqual(JSON.parse((response.content[0] as { text: string }).text))
    expect(JSON.stringify(response.structuredContent)).toContain('font-family-brand')
    expect(JSON.stringify(response.structuredContent)).toContain('font-size-brand')
  } finally { context.dispose() }
})

it('does not warn about retired builtins for registered project CSS classes', async () => {
  const context = project("@import \"@master/css\"; .size\\:20px, .padding-md, .font-brand { color:red; }")
  try {
    const inspected = await inspectClass(context, { className: 'size:20px' })
    const rendered = await renderCSS(context, { classList: 'size:20px' })
    for (const diagnostics of [inspected.diagnostics, rendered.diagnostics]) {
      expect(diagnostics?.some(diagnostic => diagnostic.code === 'REMOVED_PRESET_UTILITY')).toBe(false)
    }
    for (const className of ['padding-md', 'font-brand']) {
      const native = await inspectClass(context, { className })
      expect(native.diagnostics ?? []).toEqual([])
    }
    expect(inspected.manifest).not.toHaveProperty('nativeClassNames')
    const other = await inspectClass(context, { className: 'size:30px' })
    expect(other.diagnostics?.some(diagnostic => diagnostic.code === 'REMOVED_PRESET_UTILITY')).toBe(true)
  } finally { context.dispose() }
})
