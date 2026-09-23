import type { DocumentOption } from '../components/DocumentOptions'

export const agentOptions = {
  "project": {
    "label": "Project tools",
    "options": [
      {
        "name": "mastercss_workspace_info",
        "description": "Report workspace roots, resolved Master CSS package locations, and manifest status."
      },
      {
        "name": "mastercss_setup_audit",
        "description": "Audit package, entry stylesheet, manifest, integration, and package-resolution setup."
      },
      {
        "name": "mastercss_inspect_class",
        "description": "Inspect one class and return semantic parts, generated rules, variables, and CSS text."
      },
      {
        "name": "mastercss_trace_class",
        "description": "Trace one class through source extraction, scanner state, missing CSS classification, and generated rules."
      },
      {
        "name": "mastercss_extract_classes",
        "description": "Extract class positions and validation summaries from project files or an in-memory source buffer."
      },
      {
        "name": "mastercss_inspect_directives",
        "description": "Inspect CSS-first directives and report manifest, dependency, warning, and CSS effects."
      },
      {
        "name": "mastercss_render_css",
        "description": "Generate CSS from an HTML fragment or a whitespace-separated class list."
      },
      {
        "name": "mastercss_scan_project",
        "description": "Scan source files, register stylesheet entries, check optional classes, and report scanner state, generated CSS metadata, and missing CSS diagnostics."
      },
      {
        "name": "mastercss_manifest_query",
        "description": "Query active manifest tokens, utilities, variants, modes, conditions, and aliases."
      },
      {
        "name": "mastercss_css_compare",
        "description": "Compare generated CSS for before/after class lists, HTML fragments, or source buffers."
      },
      {
        "name": "mastercss_lint_project",
        "description": "Run Master CSS class-list diagnostics for workspace files and return fix proposals without writing files."
      },
      {
        "name": "mastercss_lint_content",
        "description": "Run Master CSS class-list diagnostics on an in-memory source buffer without writing files."
      },
      {
        "name": "mastercss_suggest_syntax",
        "description": "Return language-service completions and hover context for a document position."
      },
      {
        "name": "mastercss_preview_fixes",
        "description": "Create a diff preview for lint fixes or generated CSS output and return a confirmation token."
      },
      {
        "name": "mastercss_preview_directive_format",
        "description": "Format an in-memory CSS buffer, or preview file formatting with a token. Workspace files remain unchanged until mastercss_apply_preview."
      },
      {
        "name": "mastercss_apply_preview",
        "description": "Write a reviewed preview after validating its token, expiry, source hashes, and workspace paths."
      }
    ]
  },
  "contributor": {
    "label": "Contributor tools",
    "options": [
      {
        "name": "mastercss_repo_context",
        "description": "Route changed paths or a diff to affected packages, required context files, risks, and validation commands."
      },
      {
        "name": "mastercss_change_impact",
        "description": "Summarize contributor change risk for CSS output, runtime, extraction, language tooling, ESLint, docs, and package boundaries."
      },
      {
        "name": "mastercss_test_router",
        "description": "Return focused validation commands for contributor changes."
      },
      {
        "name": "mastercss_package_graph",
        "description": "Report workspace package ownership, scripts, exports, workspace dependencies, and dependents."
      }
    ]
  },
  "prompts": {
    "label": "Built-in MCP prompts",
    "options": [
      {
        "name": "debug-missing-css",
        "description": "Inspect scanner coverage, manifest loading, syntax, native CSS pruning, and stylesheet entry configuration when classes do not produce CSS."
      },
      {
        "name": "review-mastercss-classes",
        "description": "Run class diagnostics and propose only safe, scoped write previews."
      },
      {
        "name": "migrate-to-mastercss",
        "description": "Audit an existing styling system and produce an incremental migration plan before editing."
      }
    ]
  },
  "server": {
    "label": "Local server options",
    "options": [
      {
        "name": "--root",
        "defaultValue": "current working directory",
        "description": "Existing workspace directory used for manifest discovery and relative file paths. Use an absolute path in client configuration."
      },
      {
        "name": "--preview-ttl",
        "defaultValue": "300000 ms (5 minutes)",
        "description": "Lifetime of a generated preview token. Preview tools can override it with ttlMs, from 1000 to 3600000 milliseconds."
      }
    ]
  },
  "surfaces": {
    "label": "Choose a tooling surface",
    "options": [
      {
        "name": "MCP server",
        "description": "AI tool calls with project context and a preview/apply workflow."
      },
      {
        "name": "CLI JSON",
        "description": "Terminal scripts and automated preflight reports. Check report diagnostics when using --exit-code never."
      },
      {
        "name": "ESLint",
        "description": "Editor and CI linting with the team’s configured rules and framework parser."
      },
      {
        "name": "Language Service",
        "description": "Completions, generated CSS hover, colors, highlighting, and directive formatting."
      }
    ]
  }
} satisfies Record<string, { label: string, options: DocumentOption[] }>

export function agentOptionGroup(name: string) {
  if (!Object.hasOwn(agentOptions, name)) throw new Error(`Unknown agent option group: ${name}`)
  return agentOptions[name as keyof typeof agentOptions]
}
export function agentOptionsMarkdown(name: string) {
  return agentOptionGroup(name).options.map((option: DocumentOption) => `- **${option.name}**${option.defaultValue === undefined ? '' : ` — default: \`${option.defaultValue}\``}. ${option.description}`).join('\n')
}
