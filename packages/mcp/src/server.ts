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
import { jsonResourceResult, jsonToolResult } from './result'

export interface MasterCSSMCPServerInstance {
    server: McpServer
    context: MasterCSSMCPContext
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
                        text: 'Inspect the workspace with Master CSS MCP tools, identify current stylesheet entries and class extraction coverage, then plan migration steps that preserve CSS output unless a deliberate behavior change is requested.'
                    }
                }
            ]
        })
    )
}

function registerTools(server: McpServer, context: MasterCSSMCPContext) {
    server.registerTool(
        'mastercss_workspace_info',
        {
            title: 'Master CSS Workspace Info',
            description: 'Report workspace roots, resolved Master CSS packages, and project manifest status.',
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async () => jsonToolResult(await getWorkspaceInfo(context))
    )

    server.registerTool(
        'mastercss_inspect_class',
        {
            title: 'Inspect Master CSS Class',
            description: 'Inspect one Master CSS class and return semantic parts, generated rules, variables, and CSS text.',
            inputSchema: {
                className: z.string().min(1),
                mode: z.string().optional()
            },
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await inspectClass(context, input))
    )

    server.registerTool(
        'mastercss_render_css',
        {
            title: 'Render Master CSS',
            description: 'Generate CSS from an HTML fragment or a whitespace-separated class list.',
            inputSchema: {
                html: z.string().optional(),
                classList: z.string().optional()
            },
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await renderCSS(context, input))
    )

    server.registerTool(
        'mastercss_scan_project',
        {
            title: 'Scan Master CSS Project',
            description: 'Scan source files, register stylesheet entries, and report scanner state and generated CSS metadata.',
            inputSchema: {
                patterns: z.array(z.string()).optional(),
                classes: z.array(z.string()).optional(),
                includeCss: z.boolean().optional()
            },
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await scanProject(context, input))
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
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await getRepoContext(context, input))
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
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await getChangeImpact(context, input))
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
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await getTestRouter(context, input))
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
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await getPackageGraph(context, input))
    )

    server.registerTool(
        'mastercss_lint_project',
        {
            title: 'Lint Master CSS Project',
            description: 'Run Master CSS class-list diagnostics and return fix proposals without writing files.',
            inputSchema: {
                patterns: z.array(z.string()).optional(),
                rules: z.string().optional()
            },
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await lintProject(context, input))
    )

    server.registerTool(
        'mastercss_lint_content',
        {
            title: 'Lint Master CSS Content',
            description: 'Run Master CSS class-list diagnostics on an in-memory source buffer without writing files.',
            inputSchema: {
                content: z.string(),
                filePath: z.string(),
                rules: z.string().optional()
            },
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await lintContent(context, input))
    )

    server.registerTool(
        'mastercss_suggest_syntax',
        {
            title: 'Suggest Master CSS Syntax',
            description: 'Return language-service completions and hover context for a document position.',
            inputSchema: {
                content: z.string(),
                filePath: z.string(),
                position: z.object({
                    line: z.number().int().min(0),
                    character: z.number().int().min(0)
                }),
                triggerCharacter: z.string().optional(),
                limit: z.number().int().min(1).max(200).optional()
            },
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await suggestSyntax(context, input))
    )

    server.registerTool(
        'mastercss_preview_fixes',
        {
            title: 'Preview Master CSS Fixes',
            description: 'Create a diff preview for lint fixes or generated CSS output and return a confirmation token.',
            inputSchema: {
                mode: z.enum(['lint-fixes', 'generated-css']).optional(),
                patterns: z.array(z.string()).optional(),
                rules: z.string().optional(),
                includeDirectiveFixes: z.boolean().optional(),
                outputPath: z.string().optional(),
                ttlMs: z.number().int().min(1000).max(60 * 60 * 1000).optional()
            },
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
                return jsonToolResult(await previewGeneratedCSS(context, {
                    patterns: input.patterns,
                    includeCss: true,
                    outputPath: input.outputPath,
                    ttlMs: input.ttlMs
                }))
            }
            return jsonToolResult(await previewLintFixes(context, input))
        }
    )

    server.registerTool(
        'mastercss_apply_preview',
        {
            title: 'Apply Master CSS Preview',
            description: 'Apply a previously generated preview token after validating hashes and workspace containment.',
            inputSchema: {
                confirmToken: z.string().min(1)
            },
            annotations: {
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: false
            }
        },
        async (input) => jsonToolResult(await context.applyPreview(input.confirmToken))
    )
}

export function createMasterCSSMCPServer(options: MasterCSSMCPContextOptions = {}): MasterCSSMCPServerInstance {
    const context = new MasterCSSMCPContext(options)
    const server = new McpServer({
        name: '@master/css-mcp',
        version: readPackageVersion()
    })
    registerResources(server, context)
    registerPrompts(server)
    registerTools(server, context)
    return { server, context }
}

export async function startStdioServer(options: MasterCSSMCPContextOptions = {}) {
    const { server } = createMasterCSSMCPServer(options)
    const transport = new StdioServerTransport()
    await server.connect(transport)
    return server
}
