import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, describe, expect, it } from 'vitest'
import MasterCSSMCPContext from '../src/context'
import { createMasterCSSMCPServer } from '../src/server'

const tempDirs: string[] = []

function createTempDir(prefix: string) {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

function writeJSON(filePath: string, value: unknown) {
  writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function createContributorFixture() {
  const root = createTempDir('master-css-mcp-contributor-')
  mkdirSync(join(root, '.ai/context'), { recursive: true })
  mkdirSync(join(root, '.github/prompts'), { recursive: true })
  mkdirSync(join(root, 'packages/engine'), { recursive: true })
  mkdirSync(join(root, 'packages/runtime'), { recursive: true })
  mkdirSync(join(root, 'packages/mcp'), { recursive: true })
  mkdirSync(join(root, 'packages/create'), { recursive: true })
  mkdirSync(join(root, 'packages/css-sv'), { recursive: true })
  mkdirSync(join(root, 'site'), { recursive: true })
  writeFileSync(join(root, 'AGENTS.md'), 'Read .ai/context/index.md')
  writeFileSync(join(root, '.ai/context/index.md'), '# Context Pack Index')
  writeFileSync(join(root, '.ai/context/package-routing.md'), '# Package Routing Pack')
  writeFileSync(join(root, '.ai/context/docs.md'), '# Docs Pack')
  writeFileSync(join(root, '.github/prompts/fix-bug.prompt.md'), '# Fix Bug')
  writeJSON(join(root, 'package.json'), {
    name: 'master-css-repo',
    private: true,
    scripts: {
      'test:docs-consistency': 'node --test .ai/scripts/validate-doc-consistency.test.js'
    }
  })
  writeJSON(join(root, 'packages/engine/package.json'), {
    name: '@master/css-engine',
    scripts: {
      build: 'tsdown',
      lint: 'eslint',
      test: 'vitest',
      'type-check': 'tsc -b tsconfig.typecheck.json'
    }
  })
  writeFileSync(join(root, 'packages/engine/AI.md'), '# AI Notes For `@master/css-engine`')
  writeJSON(join(root, 'packages/runtime/package.json'), {
    name: '@master/css-runtime',
    scripts: {
      e2e: 'playwright test',
      lint: 'eslint',
      test: 'vitest'
    },
    dependencies: {
      '@master/css-engine': 'workspace:^'
    }
  })
  writeFileSync(join(root, 'packages/runtime/AI.md'), '# AI Notes For `@master/css-runtime`')
  writeJSON(join(root, 'packages/mcp/package.json'), {
    name: '@master/css-mcp',
    scripts: {
      build: 'tsdown',
      lint: 'eslint',
      test: 'vitest',
      'type-check': 'tsc -b tsconfig.typecheck.json'
    }
  })
  writeFileSync(join(root, 'packages/mcp/AI.md'), '# AI Notes For `@master/css-mcp`')
  writeJSON(join(root, 'packages/create/package.json'), {
    name: '@master/create-css',
    scripts: {
      build: 'tsdown',
      lint: 'eslint',
      test: 'vitest'
    }
  })
  writeFileSync(join(root, 'packages/create/AI.md'), '# AI Notes For `@master/create-css`')
  writeJSON(join(root, 'packages/css-sv/package.json'), {
    name: '@master/css-sv',
    scripts: {
      build: 'tsdown',
      lint: 'eslint',
      test: 'vitest'
    }
  })
  writeFileSync(join(root, 'packages/css-sv/AI.md'), '# AI Notes For `@master/css-sv`')
  writeJSON(join(root, 'site/package.json'), {
    name: 'site',
    private: true,
    scripts: {
      'prepare-app': 'tsx ./prepare'
    }
  })
  writeFileSync(join(root, 'site/AI.md'), '# Site AI Instructions')
  return root
}

async function connect(root: string) {
  const instance = createMasterCSSMCPServer({ root })
  const client = new Client({ name: 'master-css-mcp-test', version: '0.0.0' }, { capabilities: {} })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  await Promise.all([
    instance.server.connect(serverTransport),
    client.connect(clientTransport)
  ])
  return {
    client,
    instance,
    async close() {
      await client.close()
      await instance.server.close()
    }
  }
}

function parseToolJSON(result: Awaited<ReturnType<Client['callTool']>>) {
  if (!('content' in result)) throw new Error('Expected callTool content result.')
  const content = (result as { content: { type: string, text?: string }[] }).content[0]
  if (!content || content.type !== 'text') throw new Error('Expected text content.')
  try {
    return JSON.parse(content.text || '') as any
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
        'mastercss_repo_context',
        'mastercss_change_impact',
        'mastercss_test_router',
        'mastercss_package_graph',
        'mastercss_manifest_query',
        'mastercss_css_compare',
        'mastercss_lint_content',
        'mastercss_preview_fixes',
        'mastercss_preview_directive_format',
        'mastercss_apply_preview'
      ]))

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
      expect(migrationText).toContain('plan an incremental migration')
      expect(migrationText).toContain('recommended rendering mode')
      expect(migrationText).toContain('Preserve CSS output')

      const resource = await connection.client.readResource({ uri: 'mastercss://workspace/manifest' })
      expect(resource.contents[0]).toEqual(expect.objectContaining({
        mimeType: 'application/json'
      }))

      const rendered = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_render_css',
        arguments: {
          classList: 'block'
        }
      }))
      expect(rendered.classes).toEqual(['block'])
      expect(rendered.css.text).toContain('display:block')

      const renderedNative = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_render_css',
        arguments: {
          classList: 'block field-sizing:content display:banana'
        }
      }))
      expect(renderedNative.invalid).toEqual(['display:banana'])
      expect(renderedNative.css.text).toContain('.block{display:block}')
      expect(renderedNative.css.text).toContain('.field-sizing\\:content{field-sizing:content}')
      expect(renderedNative.css.bytes).toBe(renderedNative.css.text.length)
    } finally {
      await connection.close()
    }
  })

  it('audits setup and inspects CSS-first directives through MCP', async () => {
    const root = createTempDir('master-css-mcp-setup-')
    writeJSON(join(root, 'package.json'), {
      name: 'setup-fixture',
      devDependencies: {
        '@master/css': 'workspace:^',
        '@master/css-cli': 'workspace:^',
        '@master/create-css': 'workspace:^',
        '@master/css-sv': 'workspace:^',
        '@master/eslint-config-css': 'workspace:^'
      },
      scripts: {
        build: 'master-css src/index.html -o master.css'
      }
    })
    writeFileSync(join(root, 'master.css'), [
      '@master entry;',
      '@settings {',
      '  mode-trigger: class;',
      '}',
      '@theme {',
      '  --color-brand: #123456;',
      '}'
    ].join('\n'))

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
        expect.objectContaining({ name: '@master/css-sv' }),
        expect.objectContaining({ name: '@master/eslint-config-css' })
      ]))
      expect(audit.packages.setup).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: '@master/create-css' }),
        expect.objectContaining({ name: '@master/css-sv' })
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
      expect(integrationPackageNames).not.toContain('@master/css-sv')

      const directives = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_inspect_directives',
        arguments: {
          entryPath: 'master.css'
        }
      }))
      expect(directives.version).toBe(1)
      expect(directives.status).toBe('ok')
      expect(directives.directiveEntries).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'theme' }),
        expect.objectContaining({ name: 'settings' })
      ]))
      expect(directives.manifest.counts.variables).toBeGreaterThan(0)
    } finally {
      await connection.close()
    }
  })

  it('traces, extracts, queries, and compares Master CSS classes through MCP', async () => {
    const root = createTempDir('master-css-mcp-class-tools-')
    writeFileSync(join(root, 'index.html'), '<div class="block fg:red"></div>')

    const connection = await connect(root)
    try {
      const trace = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_trace_class',
        arguments: {
          className: 'block',
          patterns: ['index.html']
        }
      }))
      expect(trace.version).toBe(1)
      expect(trace.status).toBe('present')
      expect(trace.reason).toBe('generated')
      expect(trace.detected).toBe(true)
      expect(trace.inspection.valid).toBe(true)

      const inspected = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_inspect_class',
        arguments: {
          className: 'block',
          mode: 'dark'
        }
      }))
      expect(inspected).toMatchObject({
        className: 'block',
        mode: 'dark',
        valid: true,
        base: 'block',
        suffix: '',
        matcherTypes: ['static']
      })
      expect(inspected.rules).toHaveLength(1)
      expect(inspected.rules[0].text).toContain('@media (prefers-color-scheme:dark)')
      expect(inspected.css).toBe(inspected.rules.map((rule: { text: string }) => rule.text).join(''))

      const extracted = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_extract_classes',
        arguments: {
          content: '<div className="block fg:red"></div>',
          filePath: 'src/App.tsx'
        }
      }))
      expect(extracted.version).toBe(1)
      expect(extracted.files[0].languageId).toBe('typescriptreact')
      expect(extracted.files[0].classes).toEqual(expect.arrayContaining([
        expect.objectContaining({
          token: 'block',
          valid: true
        })
      ]))

      const manifest = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_manifest_query',
        arguments: {
          query: 'spacing',
          kind: 'token',
          limit: 5
        }
      }))
      expect(manifest.version).toBe(1)
      expect(manifest.results.tokens.length).toBeGreaterThan(0)

      const compare = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_css_compare',
        arguments: {
          beforeClassList: 'block',
          afterClassList: 'block inline'
        }
      }))
      expect(compare.version).toBe(1)
      expect(compare.summary.changed).toBe(true)
      expect(compare.classes.added).toEqual(['inline'])
      expect(compare.rules.added.length).toBeGreaterThan(0)

      const nativeCompare = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_css_compare',
        arguments: {
          beforeClassList: 'block display:banana',
          afterClassList: 'block field-sizing:content'
        }
      }))
      expect(nativeCompare.invalid).toEqual({
        before: ['display:banana'],
        after: [],
        added: [],
        removed: ['display:banana']
      })
      expect(nativeCompare.css.after.text).toContain('field-sizing:content')
    } finally {
      await connection.close()
    }
  })

  it('previews directive formatting without writing until the preview is applied', async () => {
    const root = createTempDir('master-css-mcp-format-')
    const file = join(root, 'style.css')
    writeFileSync(file, '@compose block   inline;')

    const connection = await connect(root)
    try {
      const contentFormat = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_preview_directive_format',
        arguments: {
          content: '@compose block   inline;',
          filePath: 'style.css'
        }
      }))
      expect(contentFormat.mode).toBe('content')
      expect(contentFormat.formatted).toBe('@compose block inline;')

      const preview = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_preview_directive_format',
        arguments: {
          patterns: ['style.css']
        }
      }))
      expect(preview.mode).toBe('files')
      expect(preview.preview.confirmToken).toEqual(expect.any(String))
      expect(preview.preview.changes).toHaveLength(1)
      expect(readFileSync(file, 'utf8')).toBe('@compose block   inline;')

      const applied = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_apply_preview',
        arguments: {
          confirmToken: preview.preview.confirmToken
        }
      }))
      expect(applied.applied).toBe(true)
      expect(readFileSync(file, 'utf8')).toBe('@compose block inline;')
    } finally {
      await connection.close()
    }
  })

  it('routes Master CSS contributor paths to context files, risks, and validation commands', async () => {
    const root = createContributorFixture()
    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_repo_context',
        arguments: {
          task: 'fix generated css output regression',
          paths: [
            'packages/engine/src/core.ts',
            'packages/engine/tests/core.test.ts'
          ]
        }
      }))

      expect(report.version).toBe(1)
      expect(report.audience).toBe('master-css-repository-contributors')
      expect(report.status).toBe('loaded')
      expect(report.affectedPackages).toContainEqual(expect.objectContaining({
        name: '@master/css-engine',
        path: 'packages/engine',
        aiNotes: 'packages/engine/AI.md'
      }))
      expect(report.context.files).toEqual(expect.arrayContaining([
        'AGENTS.md',
        '.ai/context/index.md',
        '.ai/context/package-routing.md',
        '.ai/context/css-output.md',
        '.ai/context/testing.md',
        '.ai/context/accuracy-guardrails.md',
        'packages/engine/package.json',
        'packages/engine/AI.md'
      ]))
      expect(report.risks).toContainEqual(expect.objectContaining({
        id: 'css-output',
        severity: 'high'
      }))
      expect(report.validation.commands).toContainEqual(expect.objectContaining({
        command: 'pnpm --filter @master/css-engine test'
      }))
      expect(report.validation.commands).toContainEqual(expect.objectContaining({
        command: 'pnpm --filter @master/css-engine lint'
      }))
    } finally {
      await connection.close()
    }
  })

  it('summarizes change impact and package graph for contributor tools', async () => {
    const root = createContributorFixture()
    const connection = await connect(root)
    try {
      const impact = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_change_impact',
        arguments: {
          diff: [
            'diff --git a/packages/runtime/src/core.ts b/packages/runtime/src/core.ts',
            '--- a/packages/runtime/src/core.ts',
            '+++ b/packages/runtime/src/core.ts'
          ].join('\n')
        }
      }))

      expect(impact.status).toBe('loaded')
      expect(impact.summary.highRisk).toBeGreaterThan(0)
      expect(impact.risks).toContainEqual(expect.objectContaining({
        id: 'runtime',
        severity: 'high'
      }))

      const tests = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_test_router',
        arguments: {
          paths: ['packages/runtime/src/core.ts']
        }
      }))
      expect(tests.validation.commands).toContainEqual(expect.objectContaining({
        command: 'pnpm --filter @master/css-runtime e2e'
      }))

      const graph = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_package_graph',
        arguments: {
          packageName: '@master/css-engine'
        }
      }))
      expect(graph.packages).toEqual([
        expect.objectContaining({
          name: '@master/css-engine',
          dependents: ['@master/css-runtime']
        })
      ])
    } finally {
      await connection.close()
    }
  })

  it('routes setup package contributor paths to testing and package-boundary context', async () => {
    const root = createContributorFixture()
    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_repo_context',
        arguments: {
          paths: [
            'packages/create/src/core.ts',
            'packages/css-sv/src/transforms.ts'
          ]
        }
      }))

      expect(report.status).toBe('loaded')
      expect(report.affectedPackages).toEqual(expect.arrayContaining([
        expect.objectContaining({
          name: '@master/create-css',
          path: 'packages/create',
          aiNotes: 'packages/create/AI.md'
        }),
        expect.objectContaining({
          name: '@master/css-sv',
          path: 'packages/css-sv',
          aiNotes: 'packages/css-sv/AI.md'
        })
      ]))
      expect(report.context.files).toEqual(expect.arrayContaining([
        '.ai/context/testing.md',
        '.ai/context/package-boundaries.md',
        'packages/create/package.json',
        'packages/create/AI.md',
        'packages/css-sv/package.json',
        'packages/css-sv/AI.md'
      ]))
      expect(report.validation.commands).toEqual(expect.arrayContaining([
        expect.objectContaining({
          command: 'pnpm --filter @master/create-css test'
        }),
        expect.objectContaining({
          command: 'pnpm --filter @master/create-css lint'
        }),
        expect.objectContaining({
          command: 'pnpm --filter @master/css-sv test'
        }),
        expect.objectContaining({
          command: 'pnpm --filter @master/css-sv lint'
        })
      ]))
    } finally {
      await connection.close()
    }
  })

  it('returns limited contributor routing outside the Master CSS repository', async () => {
    const root = createTempDir('master-css-mcp-limited-')
    mkdirSync(join(root, 'src'), { recursive: true })
    writeJSON(join(root, 'package.json'), {
      name: 'ordinary-app',
      scripts: {
        test: 'vitest'
      }
    })
    writeFileSync(join(root, 'src/App.tsx'), 'export function App() { return null }')

    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_repo_context',
        arguments: {
          paths: ['src/App.tsx']
        }
      }))

      expect(report.status).toBe('limited')
      expect(report.reason).toContain('optimized for the Master CSS monorepo')
      expect(report.affectedPackages).toContainEqual(expect.objectContaining({
        name: 'ordinary-app',
        path: '.',
        aiNotes: null
      }))
      expect(report.context.files).toEqual([])
      expect(report.risks).toEqual([])
      expect(report.validation.commands).toEqual([])

      const graph = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_package_graph',
        arguments: {}
      }))
      expect(graph.status).toBe('limited')
      expect(graph.packages).toContainEqual(expect.objectContaining({
        name: 'ordinary-app',
        scripts: ['test']
      }))
    } finally {
      await connection.close()
    }
  })

  it('routes AI-facing documentation changes to docs consistency validation', async () => {
    const root = createContributorFixture()
    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_repo_context',
        arguments: {
          paths: [
            'AGENTS.md',
            '.ai/context/index.md',
            '.github/prompts/fix-bug.prompt.md'
          ]
        }
      }))

      expect(report.status).toBe('loaded')
      expect(report.affectedPackages).toEqual([
        expect.objectContaining({
          name: 'agent-docs',
          path: '.ai',
          kind: 'agent-docs'
        })
      ])
      expect(report.risks).toContainEqual(expect.objectContaining({
        id: 'agent-instructions',
        severity: 'info'
      }))
      expect(report.validation.commands).toContainEqual(expect.objectContaining({
        command: 'pnpm run test:docs-consistency'
      }))
    } finally {
      await connection.close()
    }
  })

  it('routes site documentation changes to site context and prepare validation', async () => {
    const root = createContributorFixture()
    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_repo_context',
        arguments: {
          paths: [
            'site/app/[locale]/guide/mcp-server/content.mdx',
            'site/package.json'
          ]
        }
      }))

      expect(report.status).toBe('loaded')
      expect(report.affectedPackages).toContainEqual(expect.objectContaining({
        name: 'site',
        path: 'site',
        aiNotes: 'site/AI.md'
      }))
      expect(report.context.files).toEqual(expect.arrayContaining([
        '.ai/context/docs.md',
        '.ai/context/package-boundaries.md',
        'site/package.json',
        'site/AI.md'
      ]))
      expect(report.risks).toContainEqual(expect.objectContaining({
        id: 'docs',
        severity: 'info'
      }))
      expect(report.risks).toContainEqual(expect.objectContaining({
        id: 'public-api-or-package-boundary',
        severity: 'warning'
      }))
      expect(report.validation.commands).toContainEqual(expect.objectContaining({
        command: 'pnpm --filter site prepare-app'
      }))
    } finally {
      await connection.close()
    }
  })

  it('previews and applies lint fixes only with a confirmation token', async () => {
    const root = createTempDir('master-css-mcp-fix-')
    const file = join(root, 'index.html')
    writeFileSync(file, '<div class="fg:white m:2x"></div>')

    const connection = await connect(root)
    try {
      const preview = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_preview_fixes',
        arguments: {
          patterns: ['index.html']
        }
      }))

      expect(preview.mode).toBe('lint-fixes')
      expect(preview.preview.confirmToken).toEqual(expect.any(String))
      expect(preview.preview.changes).toHaveLength(1)
      expect(readFileSync(file, 'utf8')).toBe('<div class="fg:white m:2x"></div>')

      const applied = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_apply_preview',
        arguments: {
          confirmToken: preview.preview.confirmToken
        }
      }))
      expect(applied.applied).toBe(true)
      expect(readFileSync(file, 'utf8')).not.toBe('<div class="fg:white m:2x"></div>')
    } finally {
      await connection.close()
    }
  })

  it('lints cjs files with the shared script language mapping', async () => {
    const root = createTempDir('master-css-mcp-cjs-')
    writeFileSync(join(root, 'component.cjs'), 'const view = <div className="fg:white m:2x" />')

    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_lint_project',
        arguments: {
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
    writeFileSync(join(root, 'index.html'), '<div class="block text-decoration:bad()"></div>')

    const connection = await connect(root)
    try {
      const report = parseToolJSON(await connection.client.callTool({
        name: 'mastercss_scan_project',
        arguments: {
          patterns: ['index.html'],
          classes: ['block', 'never-generated-class']
        }
      }))

      expect(report.version).toBe(1)
      expect(report.root).toBe(connection.instance.context.root)
      expect(report.files[0].discovered.valid).toContain('block')
      expect(report.files[0].discovered.invalid).toContain('text-decoration:bad()')
      expect(report.missingCSS.present).toContainEqual(expect.objectContaining({
        className: 'block',
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
          filePath: 'src/Component.tsx',
          content: 'export function Component() { return <div className="fg:white m:2x" /> }'
        }
      }))

      expect(report.version).toBe(1)
      expect(report.root).toBe(connection.instance.context.root)
      expect(report.files).toHaveLength(1)
      expect(report.files[0].filePath).toBe(resolve(connection.instance.context.root, 'src/Component.tsx'))
      expect(report.files[0].languageId).toBe('typescriptreact')
      expect(report.files[0].diagnostics).toContainEqual(expect.objectContaining({
        code: 'invalid-class-order'
      }))
    } finally {
      await connection.close()
    }
  })

  it('rejects root escape patterns and stale preview writes', async () => {
    const root = createTempDir('master-css-mcp-safety-')
    const file = join(root, 'index.html')
    writeFileSync(file, '<div class="block"></div>')
    const context = new MasterCSSMCPContext({ root })

    expect(() => context.validateGlobPatterns(['../outside.html'])).toThrow('escape')

    const preview = await context.createPreview([
      {
        filePath: resolve(root, 'index.html'),
        afterText: '<div class="inline"></div>'
      }
    ])
    expect(preview.confirmToken).toEqual(expect.any(String))
    writeFileSync(file, '<div class="flex"></div>')
    await expect(context.applyPreview(preview.confirmToken!)).rejects.toThrow('changed')
    expect(readFileSync(file, 'utf8')).toBe('<div class="flex"></div>')
  })

  it('accepts writable files addressed through the configured root path alias', async () => {
    const root = createTempDir('master-css-mcp-alias-')
    const context = new MasterCSSMCPContext({ root })
    const file = join(root, 'generated.css')

    const preview = await context.createPreview([
      {
        filePath: file,
        afterText: '.block{display:block}'
      }
    ])

    expect(preview.confirmToken).toEqual(expect.any(String))
    const applied = await context.applyPreview(preview.confirmToken!)
    expect(applied.applied).toBe(true)
    expect(readFileSync(file, 'utf8')).toBe('.block{display:block}')
  })
})
