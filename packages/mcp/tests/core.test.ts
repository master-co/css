import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, describe, expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { createMasterCSSMCPServer } from '../src/server'

const tempDirs: string[] = []

function createTempDir(prefix: string) {
  const dir = realpathSync(mkdtempSync(join(tmpdir(), prefix)))
  tempDirs.push(dir)
  return dir
}

function writeJSON(filePath: string, value: unknown) {
  writeFileSync(filePath, JSON.stringify(value, null, 2))
}

async function connect(root: string) {
  const instance = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'master-css-mcp-test', version: '0.0.0' }, { capabilities: {} })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([
    instance.connect(serverTransport),
    client.connect(clientTransport)
  ])
  return {
    client,
    instance,
    async close() {
      await client.close()
      await instance.dispose()
    }
  }
}

function parseToolJSON(result: Awaited<ReturnType<Client['callTool']>>) {
  if (!('content' in result)) throw new Error('Expected callTool content result.')
  const content = (result as { content: { type: string, text?: string }[] }).content[0]
  if (!content || content.type !== 'text') throw new Error('Expected text content.')
  try {
    const envelope = JSON.parse(content.text || '')
    expect(envelope.version).toBe(3)
    expect(envelope.result.status).toBe('success')
    return envelope.result.data as any
  } catch (error) {
    throw new Error(`Expected JSON tool result, received: ${content.text}`)
  }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('@master/css-mcp', () => {
  it('registers tools, resources, prompts, and renders CSS through MCP', async () => {
    const root = createTempDir('master-css-mcp-basic-')
    const connection = await connect(root)
    try {
      const tools = await connection.client.listTools()
      expect(tools.tools.map((tool) => tool.name)).toEqual(expect.arrayContaining([
        'mastercss_workspace_info',
        'mastercss_setup_audit',
        'mastercss_render_css',
        'mastercss_trace_class',
        'mastercss_extract_classes',
        'mastercss_inspect_directives',
        'mastercss_manifest_query',
        'mastercss_css_compare',
        'mastercss_lint_content',
        'mastercss_preview_fixes',
        'mastercss_preview_directive_format',
        'mastercss_apply_preview'
      ]))

      for (const name of ['mastercss_repo_context', 'mastercss_change_impact', 'mastercss_test_router', 'mastercss_package_graph']) {
        expect(tools.tools.map((tool) => tool.name)).not.toContain(name)
      }

      const prompts = await connection.client.listPrompts()
      expect(prompts.prompts.map((prompt) => prompt.name)).toEqual(expect.arrayContaining([
        'debug-missing-css',
        'review-mastercss-classes',
        'migrate-to-mastercss'
      ]))

      const migrationPrompt = await connection.client.getPrompt({ name: 'migrate-to-mastercss' })
      const migrationText = migrationPrompt.messages.map((message) => {
        return message.content.type === 'text' ? message.content.text : ''
      }).join('\n')
      expect(migrationText).toContain('plan a migration')
      expect(migrationText).toContain('recommended rendering mode')
      expect(migrationText).toContain('Preserve CSS output')
      for (const source of ['CSS Modules', 'Sass', 'Tailwind CSS', 'CSS-in-JS', 'component-library styling']) {
        expect(migrationText).toContain(source)
      }
      expect(migrationText).toContain('external styling systems only')
      expect(migrationText).toContain('Do not propose Master CSS version upgrades')
      expect(migrationText).not.toMatch(/Master CSS v1|Master CSS v2 RC|master-css migrate|base-unit|root-size|saved.*manifest/i)

      const resource = await connection.client.readResource({ uri: 'mastercss://workspace/manifest' })
      expect(resource.contents[0]).toEqual(expect.objectContaining({
        mimeType: 'application/json'
      }))

      const rendered = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_render_css',
        arguments: {
          context: 'preset',
          classList: '(display:block)'
        }
      }))
      expect(rendered.classes).toEqual(["(display:block)"])
      expect(rendered.css.text).toContain('display:block')

      const renderedNative = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_render_css',
        arguments: {
          context: 'preset',
          classList: '(display:block) (field-sizing:content) (display:16px) (display:banana)'
        }
      }))
      expect(renderedNative.invalid).toEqual([])
      expect(renderedNative.inspections.find((item: { className: string }) => item.className === '(display:16px)')).toMatchObject({ matchStatus: 'matched', cssValueStatus: 'invalid' })
      expect(renderedNative.inspections.find((item: { className: string }) => item.className === '(display:banana)')).toMatchObject({ matchStatus: 'matched', cssValueStatus: 'unknown' })
      expect(renderedNative.css.text).toContain(".\\(display\\:block\\){display:block}")
      expect(renderedNative.css.text).toContain('.\\(field-sizing\\:content\\){field-sizing:content}')
      expect(renderedNative.css.text).toContain('.\\(display\\:16px\\){display:16px}')
      expect(renderedNative.css.text).toContain('.\\(display\\:banana\\){display:banana}')
      expect(renderedNative.css.bytes).toBe(renderedNative.css.text.length)

      const suggestions = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_suggest_syntax',
        arguments: {
          context: 'preset',
          content: '<div class="(display:block)"></div>',
          filePath: 'index.html',
          position: { line: 0, character: 21 },
          limit: 200
        }
      }))
      expect(suggestions.total).toBeGreaterThan(0)
      expect(suggestions.completions).toEqual(expect.arrayContaining([
        expect.objectContaining({ label: 'block' })
      ]))
      expect(suggestions.hover.contents.value).toContain('display: block')
    } finally {
      await connection.close()
    }
  })

  it('audits setup and inspects CSS-first directives through MCP', async () => {
    const root = createTempDir('master-css-mcp-setup-')
    mkdirSync(join(root, 'node_modules/@master'), { recursive: true })
    symlinkSync(resolve(import.meta.dirname, '../../css'), join(root, 'node_modules/@master/css'), 'junction')
    writeJSON(join(root, 'package.json'), {
      name: 'setup-fixture',
      devDependencies: {
        '@master/css': 'workspace:^',
        '@master/css-cli': 'workspace:^',
        '@master/create-css': 'workspace:^',
        '@master/css-svelte-addon': 'workspace:^',
        '@master/eslint-config-css': 'workspace:^'
      },
      scripts: {
        build: 'master-css src/index.html -o master.css'
      }
    })
    writeFileSync(join(root, 'master.css'), `@import "@master/css";
@mixin --ocean { &:where([data-theme=ocean], [data-theme=ocean] *) { @contents; } } @utility ocean { &:where([data-theme=ocean], [data-theme=ocean] *) { @contents; } }
@theme {
  --color-brand: #123456;
 }
`)

    const connection = await connect(root)
    try {
      const audit = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_setup_audit',
        arguments: {}
      }))
      expect(audit.version).toBe(1)
      expect(audit.manifest.entries).toHaveLength(1)
      expect(audit.packages.declared).toContainEqual(expect.objectContaining({
        name: '@master/css'
      }))
      expect(audit.packages.declared).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: '@master/create-css' }),
        expect.objectContaining({ name: '@master/css-svelte-addon' }),
        expect.objectContaining({ name: '@master/eslint-config-css' })
      ]))
      expect(audit.packages.setup).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: '@master/create-css' }),
        expect.objectContaining({ name: '@master/css-svelte-addon' })
      ]))
      expect(audit.summary.setupPackages).toBe(2)
      expect(audit.integrations).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: '@master/css-cli'
        }),
        expect.objectContaining({
          name: '@master/eslint-config-css'
        })
      ]))
      const integrationPackageNames = audit.integrations
        .filter((integration: { type: string }) => integration.type === 'package')
        .map((integration: { name: string }) => integration.name)
      expect(integrationPackageNames).not.toContain('@master/create-css')
      expect(integrationPackageNames).not.toContain('@master/css-svelte-addon')

      const directives = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_inspect_directives',
        arguments: {
          entryPath: 'master.css'
        }
      }))
      expect(directives.version).toBe(2)
      expect(directives.status).toBe('ok')
      expect(directives.directiveEntries).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'theme' }),
        expect.objectContaining({ name: 'mixin' })
      ]))
      expect(directives.manifest.counts.variables).toBeGreaterThan(0)
    } finally {
      await connection.close()
    }
  })

  it('traces, extracts, queries, and compares Master CSS classes through MCP', async () => {
    const root = createTempDir('master-css-mcp-class-tools-')
    writeFileSync(join(root, 'index.html'), "<div class=\"(display:block) fg-red\"></div>")

    const connection = await connect(root)
    try {
      const trace = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_trace_class',
        arguments: {
          context: 'preset',
          className: "(display:block)",
          patterns: ['index.html']
        }
      }))
      expect(trace.version).toBe(1)
      expect(trace.status).toBe('present')
      expect(trace.reason).toBe('generated')
      expect(trace.detected).toBe(true)
      expect(trace.inspection.matchStatus).toBe('matched')

      const inspected = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_inspect_class',
        arguments: {
          context: 'preset',
          className: "(display:block)@dark"
        }
      }))
      expect(inspected).toMatchObject({
        className: "(display:block)@dark",
        matchStatus: 'matched',
        base: '(display:block)',
        suffix: '@dark',
        matcherTypes: ['key']
      })
      expect(inspected.rules).toHaveLength(1)
      expect(inspected.rules[0].text).toMatch(/@media \(prefers-color-scheme:\s*dark\)/)
      expect(inspected.css).toBe(inspected.rules.map((rule: { text: string }) => rule.text).join(''))

      const extracted = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_extract_classes',
        arguments: {
          context: 'preset',
          content: '<div className="(display:block) fg-red"></div>',
          filePath: 'src/App.tsx'
        }
      }))
      expect(extracted.version).toBe(1)
      expect(extracted.files[0].languageId).toBe('typescriptreact')
      expect(extracted.files[0].classes).toEqual(expect.arrayContaining([
        expect.objectContaining({
          token: "(display:block)",
          matchStatus: 'matched'
        })
      ]))

      const manifest = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_manifest_query',
        arguments: {
          context: 'preset',
          query: 'spacing',
          kind: 'token',
          limit: 5
        }
      }))
      expect(manifest.version).toBe(6)
      expect(manifest.results.tokens.length).toBeGreaterThan(0)

      const compare = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_css_compare',
        arguments: {
          context: 'preset',
          beforeClassList: '(display:block)',
          afterClassList: '(display:block) (display:inline)'
        }
      }))
      expect(compare.version).toBe(2)
      expect(compare.summary.changed).toBe(true)
      expect(compare.classes.added).toEqual(["(display:inline)"])
      expect(compare.rules.added.length).toBeGreaterThan(0)

      const nativeCompare = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_css_compare',
        arguments: {
          context: 'preset',
          beforeClassList: '(display:block) (display:16px) (display:banana)',
          afterClassList: '(display:block) (field-sizing:content)'
        }
      }))
      expect(nativeCompare.invalid).toEqual({
        before: [],
        after: [],
        added: [],
        removed: []
      })
      expect(nativeCompare.css.after.text).toContain('field-sizing:content')
      expect(nativeCompare.css.before.text).toContain('.\\(display\\:16px\\){display:16px}')
      expect(nativeCompare.css.before.text).toContain('.\\(display\\:banana\\){display:banana}')
    } finally {
      await connection.close()
    }
  })

  it('previews directive formatting without writing until the preview is applied', async () => {
    const root = createTempDir('master-css-mcp-format-')
    const file = join(root, 'style.css')
    writeFileSync(file, '@safelist "(display:block)   (display:inline)";')

    const connection = await connect(root)
    try {
      const contentFormat = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_preview_directive_format',
        arguments: {
          context: 'preset',
          content: '@safelist "(display:block)   (display:inline)";',
          filePath: 'style.css'
        }
      }))
      expect(contentFormat.mode).toBe('content')
      expect(contentFormat.formatted).toBe('@safelist "(display:block) (display:inline)";')

      const preview = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_preview_directive_format',
        arguments: {
          context: 'preset',
          patterns: ['style.css']
        }
      }))
      expect(preview.mode).toBe('files')
      expect(preview.preview.confirmToken).toEqual(expect.any(String))
      expect(preview.preview.changes).toHaveLength(1)
      expect(readFileSync(file, 'utf8')).toBe('@safelist "(display:block)   (display:inline)";')

      const applied = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_apply_preview',
        arguments: {
          confirmToken: preview.preview.confirmToken
        }
      }))
      expect(applied.applied).toBe(true)
      expect(readFileSync(file, 'utf8')).toBe('@safelist "(display:block) (display:inline)";')
    } finally {
      await connection.close()
    }
  })

  it('previews and applies lint fixes only with a confirmation token', async () => {
    const root = createTempDir('master-css-mcp-fix-')
    const file = join(root, 'index.html')
    writeFileSync(file, "<div class=\"fg-white (margin:0.5rem)\"></div>")

    const connection = await connect(root)
    try {
      const preview = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_preview_fixes',
        arguments: {
          context: 'preset',
          patterns: ['index.html']
        }
      }))

      expect(preview.mode).toBe('lint-fixes')
      expect(preview.preview.confirmToken).toEqual(expect.any(String))
      expect(preview.preview.changes).toHaveLength(1)
      expect(readFileSync(file, 'utf8')).toBe("<div class=\"fg-white (margin:0.5rem)\"></div>")

      const applied = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_apply_preview',
        arguments: {
          confirmToken: preview.preview.confirmToken
        }
      }))
      expect(applied.applied).toBe(true)
      expect(readFileSync(file, 'utf8')).not.toBe("<div class=\"fg-white (margin:0.5rem)\"></div>")
    } finally {
      await connection.close()
    }
  })

  it('lints cjs files with the shared script language mapping', async () => {
    const root = createTempDir('master-css-mcp-cjs-')
    writeFileSync(join(root, 'component.cjs'), "const view = <div className=\"fg-white (margin:0.5rem)\" />")

    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_lint_project',
        arguments: {
          context: 'preset',
          patterns: ['component.cjs']
        }
      }))

      expect(report.files).toHaveLength(1)
      expect(report.files[0].languageId).toBe('javascript')
      expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
        code: 'invalid-class-order'
      }))
    } finally {
      await connection.close()
    }
  })

  it('scans project sources with missing CSS classification', async () => {
    const root = createTempDir('master-css-mcp-scan-')
    writeFileSync(join(root, 'index.html'), "<div class=\"(display:block) p-missing\"></div>")

    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_scan_project',
        arguments: {
          context: 'preset',
          patterns: ['index.html'],
          classes: ["(display:block)", 'never-generated-class']
        }
      }))

      expect(report.version).toBe(5)
      expect(report.root).toBe(root)
      expect(report.files[0].discovered.valid).toContain("(display:block)")
      expect(report.files[0].discovered.invalid).toContain('p-missing')
      expect(report.missingCSS.present).toContainEqual(expect.objectContaining({
        className: "(display:block)",
        reason: 'generated'
      }))
      expect(report.missingCSS.missing).toContainEqual(expect.objectContaining({
        className: 'never-generated-class',
        reason: 'not-detected'
      }))
    } finally {
      await connection.close()
    }
  })

  it('lints in-memory content without requiring a file on disk', async () => {
    const root = createTempDir('master-css-mcp-content-')

    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_lint_content',
        arguments: {
          context: 'preset',
          filePath: 'src/Component.tsx',
          content: "export function Component() { return <div className=\"fg-white (margin:0.5rem)\" /> }"
        }
      }))

      expect(report.version).toBe(5)
      expect(report.coverage).toEqual({ status: 'complete', checkedFiles: [resolve(root, 'src/Component.tsx')] })
      expect(report.summary).toMatchObject({ checkedFiles: 1, filesWithDiagnostics: 1 })
      expect(report.root).toBe(root)
      expect(report.files).toHaveLength(1)
      expect(report.files[0].filePath).toBe(resolve(root, 'src/Component.tsx'))
      expect(report.files[0].languageId).toBe('typescriptreact')
      expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
        code: 'invalid-class-order'
      }))
    } finally {
      await connection.close()
    }
  })

  it('exposes checked inputs independently of diagnostic files through MCP schemas', async () => {
    const root = createTempDir('master-css-mcp-lint-coverage-')
    writeFileSync(join(root, 'clean.html'), '<div class="block"></div>')
    writeFileSync(join(root, 'invalid.html'), '<div class="(padding:red)"></div>')
    const connection = await connect(root)
    try {
      for (const [patterns, checked, diagnosed, status] of [
        [['clean.html'], 1, 0, 'complete'],
        [['*.html'], 2, 1, 'complete'],
        [['missing/*.html'], 0, 0, 'no-inputs']
      ] as const) {
        const response = await connection.client.callTool({ name: 'mastercss_lint_project', arguments: { context: 'preset', patterns: [...patterns] } })
        const report = parseToolJSON(response)
        expect(report.version).toBe(5)
        expect(report.coverage.status).toBe(status)
        expect(report.coverage.checkedFiles).toHaveLength(checked)
        expect(report.files).toHaveLength(diagnosed)
        expect(report.summary).toMatchObject({ checkedFiles: checked, filesWithDiagnostics: diagnosed })
        expect(report.summary).not.toHaveProperty('files')
      }
      const clean = parseToolJSON(await connection.client.callTool({ name: 'mastercss_lint_content', arguments: { context: 'preset', filePath: 'virtual.html', content: '<div class="block"></div>' } }))
      expect(clean.coverage).toEqual({ status: 'complete', checkedFiles: [join(root, 'virtual.html')] })
      expect(clean.files).toEqual([])
      expect(clean.summary).toMatchObject({ checkedFiles: 1, filesWithDiagnostics: 0 })
      writeFileSync(join(root, 'index.css'), '@import "@master/css"; .btn { @contents; }')
      const failed = await connection.client.callTool({ name: 'mastercss_lint_project', arguments: { patterns: ['clean.html'] } })
      expect(failed.isError).toBe(true)
      expect(failed.structuredContent).toMatchObject({ result: { status: 'error' } })
    } finally {
      await connection.close()
    }
  })

  it('rejects root escape patterns and stale preview writes', async () => {
    const root = createTempDir('master-css-mcp-safety-')
    const file = join(root, 'index.html')
    writeFileSync(file, "<div class=\"(display:block)\"></div>")
    const context = new MasterCSSMCPContext({ root })

    expect(() => context.validateGlobPatterns(['../outside.html'])).toThrow('escape')

    const preview = await context.createPreview([
      {
        filePath: resolve(root, 'index.html'),
        afterText: '<div class="(display:inline)"></div>'
      }
    ])
    expect(preview.confirmToken).toEqual(expect.any(String))
    writeFileSync(file, "<div class=\"(display:flex)\"></div>")
    await expect(context.applyPreview(preview.confirmToken!)).rejects.toThrow('changed')
    expect(readFileSync(file, 'utf8')).toBe("<div class=\"(display:flex)\"></div>")
  })

  it('accepts writable files addressed through the configured root path alias', async () => {
    const root = createTempDir('master-css-mcp-alias-')
    const context = new MasterCSSMCPContext({ root })
    const file = join(root, 'generated.css')

    const preview = await context.createPreview([
      {
        filePath: file,
        afterText: '.display\\:block{display:block}'
      }
    ])

    expect(preview.confirmToken).toEqual(expect.any(String))
    const applied = await context.applyPreview(preview.confirmToken!)
    expect(applied.applied).toBe(true)
    expect(readFileSync(file, 'utf8')).toBe(".display\\:block{display:block}")
  })
})
