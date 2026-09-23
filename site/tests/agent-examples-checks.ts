import { connect, value, errorText } from './mcp-stdio'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { agentOptions } from '../utils/agent-options'
import { agentFixExample } from '../utils/agent-guide-data'
import { agentStyleExample } from '../utils/agent-style-example'
import { configuredExampleCSS, configuredMarkupClasses } from '../reference/configured-example'
import { deliveryFences, deliverySource } from './delivery-examples'

interface PreviewReport {
  version: number
  preview: { confirmToken?: string, expiresAt?: number, changes: { afterText: string, diff: string }[] }
}

export function verifyAgentStylingExample() {
  const css = configuredExampleCSS(agentStyleExample.source, configuredMarkupClasses(agentStyleExample.html))
  for (const declaration of ['--color-brand:', '.btn', ':hover', ':focus-visible', ':disabled', 'outline-offset:']) assert.ok(css.includes(declaration), declaration)
  const dynamic = deliveryFences(deliverySource('ai-coding')).find(fence => fence.language === 'html' && fence.text.includes('var(--opacity)'))!
  assert.ok(dynamic.text.includes('style="--opacity: .8; --x: 12px"'))
  const runtimeCSS = configuredExampleCSS('', configuredMarkupClasses(dynamic.text))
  assert.ok(runtimeCSS.includes('opacity:var(--opacity)'))
  assert.ok(runtimeCSS.includes('translateX(var(--x))'))
}

export async function verifyAgentMCPExamples() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'master-doc-mcp-')))
  mkdirSync(join(root, 'src'))
  const file = join(root, 'src/button.html')
  writeFileSync(file, agentFixExample.source)
  // A marker lets the fixture confirm the configured entry rather than only the preset fallback.
  writeFileSync(join(root, 'app.css'), '@master entry;\n@theme { --color-brand: blue; }')
  const connection = await connect(root)
  try {
    const tools = await connection.request<{ tools: { name: string, inputSchema: { properties: Record<string, unknown> } }[] }>('tools/list')
    const documented = [...agentOptions.project.options, ...agentOptions.contributor.options].map(item => item.name).sort()
    assert.deepEqual(tools.tools.map(tool => tool.name).sort(), documented)
    const prompts = await connection.request<{ prompts: { name: string }[] }>('prompts/list')
    assert.deepEqual(prompts.prompts.map(prompt => prompt.name).sort(), agentOptions.prompts.options.map(prompt => prompt.name).sort())
    const resources = await connection.request<{ resources: { uri: string }[] }>('resources/list')
    assert.deepEqual(resources.resources.map(resource => resource.uri).sort(), ['entries', 'manifest', 'packages'].map(name => `mastercss://workspace/${name}`))
    const workspace = value<{ root: string, manifest: { status: string, entries: string[] } }>(await connection.call('mastercss_workspace_info'))
    assert.equal(workspace.root, root)
    assert.equal(workspace.manifest.status, 'loaded')
    assert.ok(workspace.manifest.entries.includes(join(root, 'app.css')))
    const input = JSON.parse(deliveryFences(deliverySource('mcp-server')).find(fence => fence.name === 'mastercss_preview_fixes')!.text)
    const started = Date.now()
    const preview = value<PreviewReport>(await connection.call('mastercss_preview_fixes', input))
    assert.equal(preview.version, 1)
    assert.equal(readFileSync(file, 'utf8'), agentFixExample.source)
    assert.equal(preview.preview.changes.length, 1)
    assert.equal(preview.preview.changes[0].afterText, agentFixExample.result)
    assert.ok(preview.preview.changes[0].diff.includes(`-${agentFixExample.source}`))
    assert.ok(preview.preview.changes[0].diff.includes(`+${agentFixExample.result}`))
    assert.ok(preview.preview.expiresAt! >= started + 300000)
    assert.ok(preview.preview.expiresAt! <= Date.now() + 300000)
    assert.ok(preview.preview.confirmToken)
    const token = { confirmToken: preview.preview.confirmToken }
    const applied = value<{ applied: boolean }>(await connection.call('mastercss_apply_preview', token))
    assert.equal(applied.applied, true)
    assert.equal(readFileSync(file, 'utf8'), agentFixExample.result)
    assert.match(errorText(await connection.call('mastercss_apply_preview', token)), /already applied/)
    const unchanged = value<PreviewReport>(await connection.call('mastercss_preview_fixes', input))
    assert.deepEqual(unchanged.preview.changes, [])
    assert.equal(unchanged.preview.confirmToken, undefined)
    writeFileSync(file, agentFixExample.source)
    const stale = value<PreviewReport>(await connection.call('mastercss_preview_fixes', input))
    writeFileSync(file, '<button>Newer content</button>')
    assert.match(errorText(await connection.call('mastercss_apply_preview', { confirmToken: stale.preview.confirmToken })), /changed after preview/)
    assert.equal(readFileSync(file, 'utf8'), '<button>Newer content</button>')
    assert.match(errorText(await connection.call('mastercss_preview_fixes', { patterns: ['../outside.html'] })), /escape/)
    const formatted = value<{ mode: string, formatted: string, preview?: unknown }>(await connection.call('mastercss_preview_directive_format', { content: '.card {\n  @compose bg:transparent !;\n}', filePath: 'card.css' }))
    assert.equal(formatted.mode, 'content')
    assert.equal(formatted.formatted, '.card {\n  @compose bg:transparent!;\n}')
    assert.equal(formatted.preview, undefined)
    const packageJSON = JSON.parse(readFileSync(new URL('../../packages/mcp/package.json', import.meta.url), 'utf8'))
    assert.equal(packageJSON.engines.node, '^24')
  } finally { await connection.close(); rmSync(root, { recursive: true, force: true }) }
}
