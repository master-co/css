import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'
import MasterCSSMCPContext, { type MasterCSSMCPContextOptions } from './context'
import { getWorkspaceInfo, loadWorkspaceManifest } from './project'
import { inspectClass, previewGeneratedCSS, renderCSS, scanProject } from './scan'
import { suggestSyntax } from './language'
import { lintContent, lintProject, previewLintFixes } from './lint'
import { getChangeImpact, getPackageGraph, getRepoContext, getTestRouter } from './contributor'
import { auditSetup } from './setup'
import { inspectDirectives } from './directives'
import { extractClasses, traceClass } from './classes'
import { queryManifest } from './manifest-query'
import { previewDirectiveFormat } from './format'
import { compareCSS } from './compare'
import { jsonResourceResult, executeTool } from './result'
import { toolOutputSchema } from './output-schema'

class MasterCSSMCPServer {
  readonly #server: McpServer
  readonly #context: MasterCSSMCPContext
  #disposed = false

  constructor(server: McpServer, context: MasterCSSMCPContext) {
    this.#server = server
    this.#context = context
  }

  connect(transport: Parameters<McpServer['connect']>[0]) {
    return this.#server.connect(transport)
  }

  async dispose() {
    if (this.#disposed) return
    this.#disposed = true
    this.#context.dispose()
    await this.#server.close()
  }

  [Symbol.asyncDispose]() {
    return this.dispose()
  }
}

function readPackageVersion() {
  const directory = dirname(fileURLToPath(import.meta.url))
  try {
    const pkg = JSON.parse(readFileSync(resolve(directory, '../package.json'), 'utf8')) as { version?: string }
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function registerResources(server: McpServer, context: MasterCSSMCPContext) {
  server.registerResource(
    'mastercss-workspace-manifest',
    'mastercss://workspace/manifest',
    {
      title: 'Master CSS Workspace Manifest',
      description: 'Loaded Master CSS project manifest status and entries.',
      mimeType: 'application/json'
    },
    async (uri) => jsonResourceResult(uri, await loadWorkspaceManifest(context))
  )
  server.registerResource(
    'mastercss-workspace-entries',
    'mastercss://workspace/entries',
    {
      title: 'Master CSS Workspace Entries',
      description: 'Discovered Master CSS manifest entry files.',
      mimeType: 'application/json'
    },
    async (uri) => {
      const manifest = await loadWorkspaceManifest(context)
      return jsonResourceResult(uri, {
        root: context.root,
        entries: manifest.entries
      })
    }
  )
  server.registerResource(
    'mastercss-workspace-packages',
    'mastercss://workspace/packages',
    {
      title: 'Master CSS Workspace Packages',
      description: 'Resolved Master CSS package locations for this workspace.',
      mimeType: 'application/json'
    },
    async (uri) => {
      const info = await getWorkspaceInfo(context)
      return jsonResourceResult(uri, info.packages)
    }
  )
}

function registerPrompts(server: McpServer) {
  server.registerPrompt(
    'debug-missing-css',
    {
      title: 'Debug Missing CSS',
      description: 'Guide an assistant through debugging classes that are not producing CSS.'
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'Use the Master CSS MCP tools to scan the project, inspect the missing class names, compare generated CSS, and identify whether the issue is extraction, manifest loading, invalid syntax, native CSS pruning, or stylesheet entry configuration.'
          }
        }
      ]
    })
  )
  server.registerPrompt(
    'review-mastercss-classes',
    {
      title: 'Review Master CSS Classes',
      description: 'Review class lists for invalid, conflicting, non-canonical, or unsorted classes.'
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: 'Run Master CSS lint diagnostics through the MCP server, lead with bugs or CSS output risks, and only propose write previews when fixes are safe and scoped to the workspace.'
          }
        }
      ]
    })
  )
  server.registerPrompt(
    'migrate-to-mastercss',
    {
      title: 'Migrate To Master CSS',
      description: 'Plan a migration from existing markup/styles to Master CSS classes.'
    },
    () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              'Use the Master CSS MCP tools to plan a migration from CSS, CSS Modules, Sass, Tailwind CSS, CSS-in-JS, component-library styling, Master CSS v1, or Master CSS v2 RC before editing.',
              'For pre-change v2 RC, follow https://rc.css.master.co/guide/migration/v2-rc: audit exact package versions, save the resolved RC manifest, settings and CSS/browser baseline, then coordinate source, package, native/Wasm and hydration upgrades without running both runtimes together.',
              'Named tokens use hyphens; colon values use native CSS semantics and explicit var() references. Preview master-css migrate proposals, preserve token identity and cascade behavior, and leave uncertain dynamic or custom syntax for manual review.',
              'Inspect the workspace, identify the framework, package manager, current styling systems, stylesheet entries, source extraction coverage, existing theme tokens, component classes, and available validation commands.',
              'Produce a migration plan with the recommended rendering mode, the first reviewable migration batch, CSS output risks, manual visual checks, and the formatter, lint, type-check, test, or build commands to run.',
              'Preserve CSS output unless a deliberate behavior change is requested, keep vendor or generated CSS in place, and use write previews only for safe, scoped changes.'
            ].join('\n')
          }
        }
      ]
    })
  )
}

function registerTools(server: McpServer, context: MasterCSSMCPContext) {
  const rangeSchema = z.object({
    start: z.object({
      line: z.number().int().min(0),
      character: z.number().int().min(0)
    }),
    end: z.object({
      line: z.number().int().min(0),
      character: z.number().int().min(0)
    })
  })

  server.registerTool(
    'mastercss_workspace_info',
    {
      title: 'Master CSS Workspace Info',
      description: 'Report workspace roots, resolved Master CSS packages, and project manifest status.',
      outputSchema: toolOutputSchema('mastercss_workspace_info'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => executeTool(() => getWorkspaceInfo(context))
  )

  server.registerTool(
    'mastercss_setup_audit',
    {
      title: 'Audit Master CSS Setup',
      description: 'Audit package, entry stylesheet, manifest, integration, and package-resolution setup for a workspace.',
      outputSchema: toolOutputSchema('mastercss_setup_audit'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async () => executeTool(() => auditSetup(context))
  )

  server.registerTool(
    'mastercss_inspect_class',
    {
      title: 'Inspect Master CSS Class',
      description: 'Inspect one Master CSS class and return semantic parts, generated rules, variables, and CSS text.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        className: z.string().min(1),
        mode: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_inspect_class'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => inspectClass(context, input))
  )

  server.registerTool(
    'mastercss_trace_class',
    {
      title: 'Trace Master CSS Class',
      description: 'Trace one class from project extraction through generated CSS, missing CSS classification, and engine inspection.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        className: z.string().min(1),
        patterns: z.array(z.string()).optional(),
        includeCss: z.boolean().optional(),
        mode: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_trace_class'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => traceClass(context, input))
  )

  server.registerTool(
    'mastercss_extract_classes',
    {
      title: 'Extract Master CSS Classes',
      description: 'Extract class positions and validation summaries from project files or an in-memory source buffer.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        content: z.string().optional(),
        filePath: z.string().optional(),
        patterns: z.array(z.string()).optional(),
        includeRules: z.boolean().optional()
      },
      outputSchema: toolOutputSchema('mastercss_extract_classes'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => extractClasses(context, input))
  )

  server.registerTool(
    'mastercss_inspect_directives',
    {
      title: 'Inspect Master CSS Directives',
      description: 'Inspect CSS-first directives from a stylesheet entry or in-memory CSS content and report manifest/CSS effects.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        content: z.string().optional(),
        filePath: z.string().optional(),
        entryPath: z.string().optional(),
        preserveNativeCSS: z.boolean().optional()
      },
      outputSchema: toolOutputSchema('mastercss_inspect_directives'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => inspectDirectives(context, input))
  )

  server.registerTool(
    'mastercss_render_css',
    {
      title: 'Render Master CSS',
      description: 'Generate CSS from an HTML fragment or a whitespace-separated class list.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        html: z.string().optional(),
        classList: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_render_css'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => renderCSS(context, input))
  )

  server.registerTool(
    'mastercss_scan_project',
    {
      title: 'Scan Master CSS Project',
      description: 'Scan source files, register stylesheet entries, and report scanner state and generated CSS metadata.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        patterns: z.array(z.string()).optional(),
        classes: z.array(z.string()).optional(),
        includeCss: z.boolean().optional()
      },
      outputSchema: toolOutputSchema('mastercss_scan_project'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => scanProject(context, input))
  )

  server.registerTool(
    'mastercss_repo_context',
    {
      title: 'Master CSS Repository Context',
      description: 'Route Master CSS repository contributor work to affected packages, required context files, risks, and validation commands.',
      inputSchema: {
        task: z.string().optional(),
        paths: z.array(z.string()).optional(),
        diff: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_repo_context'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => getRepoContext(context, input))
  )

  server.registerTool(
    'mastercss_change_impact',
    {
      title: 'Master CSS Change Impact',
      description: 'Classify contributor change risk for CSS output, runtime, extraction, language, ESLint, docs, and package boundaries.',
      inputSchema: {
        task: z.string().optional(),
        paths: z.array(z.string()).optional(),
        diff: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_change_impact'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => getChangeImpact(context, input))
  )

  server.registerTool(
    'mastercss_test_router',
    {
      title: 'Master CSS Test Router',
      description: 'Return focused validation commands for Master CSS repository contributor changes.',
      inputSchema: {
        task: z.string().optional(),
        paths: z.array(z.string()).optional(),
        diff: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_test_router'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => getTestRouter(context, input))
  )

  server.registerTool(
    'mastercss_package_graph',
    {
      title: 'Master CSS Package Graph',
      description: 'Report Master CSS workspace package ownership, scripts, exports, workspace dependencies, and dependents.',
      inputSchema: {
        packageName: z.string().optional(),
        includeExamples: z.boolean().optional()
      },
      outputSchema: toolOutputSchema('mastercss_package_graph'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => getPackageGraph(context, input))
  )

  server.registerTool(
    'mastercss_manifest_query',
    {
      title: 'Query Master CSS Manifest',
      description: 'Query active manifest tokens, utilities, variants, modes, conditions, and aliases.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        query: z.string().optional(),
        kind: z.enum(['all', 'token', 'utility', 'variant', 'mode', 'condition', 'alias']).optional(),
        namespace: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional()
      },
      outputSchema: toolOutputSchema('mastercss_manifest_query'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => queryManifest(context, input))
  )

  server.registerTool(
    'mastercss_css_compare',
    {
      title: 'Compare Master CSS Output',
      description: 'Compare generated CSS for before/after class lists, HTML fragments, or source buffers.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        beforeClassList: z.string().optional(),
        afterClassList: z.string().optional(),
        beforeHtml: z.string().optional(),
        afterHtml: z.string().optional(),
        beforeContent: z.string().optional(),
        afterContent: z.string().optional(),
        filePath: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_css_compare'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => compareCSS(context, input))
  )

  server.registerTool(
    'mastercss_lint_project',
    {
      title: 'Lint Master CSS Project',
      description: 'Run Master CSS class-list diagnostics and return fix proposals without writing files.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        patterns: z.array(z.string()).optional(),
        rules: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_lint_project'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => lintProject(context, input))
  )

  server.registerTool(
    'mastercss_lint_content',
    {
      title: 'Lint Master CSS Content',
      description: 'Run Master CSS class-list diagnostics on an in-memory source buffer without writing files.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        content: z.string(),
        filePath: z.string(),
        rules: z.string().optional()
      },
      outputSchema: toolOutputSchema('mastercss_lint_content'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => lintContent(context, input))
  )

  server.registerTool(
    'mastercss_suggest_syntax',
    {
      title: 'Suggest Master CSS Syntax',
      description: 'Return language-service completions and hover context for a document position.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        content: z.string(),
        filePath: z.string(),
        position: z.object({
          line: z.number().int().min(0),
          character: z.number().int().min(0)
        }),
        triggerCharacter: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional()
      },
      outputSchema: toolOutputSchema('mastercss_suggest_syntax'),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => suggestSyntax(context, input))
  )

  server.registerTool(
    'mastercss_preview_fixes',
    {
      title: 'Preview Master CSS Fixes',
      description: 'Create a diff preview for lint fixes or generated CSS output and return a confirmation token.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        mode: z.enum(['lint-fixes', 'generated-css']).optional(),
        patterns: z.array(z.string()).optional(),
        rules: z.string().optional(),
        includeDirectiveFixes: z.boolean().optional(),
        outputPath: z.string().optional(),
        ttlMs: z.number().int().min(1000).max(60 * 60 * 1000).optional()
      },
      outputSchema: toolOutputSchema('mastercss_preview_fixes'),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (input) => {
      if (input.mode === 'generated-css') {
        if (!input.outputPath) throw new Error('outputPath is required when mode is "generated-css".')
        return executeTool(() => previewGeneratedCSS(context, {
          context: input.context,
          patterns: input.patterns,
          includeCss: true,
          outputPath: input.outputPath!,
          ttlMs: input.ttlMs
        }))
      }
      return executeTool(() => previewLintFixes(context, input))
    }
  )

  server.registerTool(
    'mastercss_preview_directive_format',
    {
      title: 'Preview Master CSS Directive Format',
      description: 'Create a safe preview for formatting Master CSS directives, or format in-memory content without writing files.',
      inputSchema: {
        context: z.enum(['project', 'preset']).optional(),
        content: z.string().optional(),
        filePath: z.string().optional(),
        patterns: z.array(z.string()).optional(),
        range: rangeSchema.optional(),
        ttlMs: z.number().int().min(1000).max(60 * 60 * 1000).optional()
      },
      outputSchema: toolOutputSchema('mastercss_preview_directive_format'),
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => previewDirectiveFormat(context, input))
  )

  server.registerTool(
    'mastercss_apply_preview',
    {
      title: 'Apply Master CSS Preview',
      description: 'Apply a previously generated preview token after validating hashes and workspace containment.',
      inputSchema: {
        confirmToken: z.string().min(1)
      },
      outputSchema: toolOutputSchema('mastercss_apply_preview'),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false
      }
    },
    async (input) => executeTool(() => context.applyPreview(input.confirmToken))
  )
}

export function createMasterCSSMCPServer(options: MasterCSSMCPContextOptions = {}) {
  const context = new MasterCSSMCPContext(options)
  const server = new McpServer({
    name: '@master/css-mcp',
    version: readPackageVersion()
  })
  registerResources(server, context)
  registerPrompts(server)
  registerTools(server, context)
  return new MasterCSSMCPServer(server, context)
}

export async function startMasterCSSMCPStdioServer(options: MasterCSSMCPContextOptions = {}) {
  const server = createMasterCSSMCPServer(options)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  return server
}
