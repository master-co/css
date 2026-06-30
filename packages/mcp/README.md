# Master CSS MCP Server

Model Context Protocol server for Master CSS tooling. It lets AI clients inspect a Master CSS workspace, audit setup, read the active project manifest, inspect CSS-first directives, trace classes through extraction and generated CSS, render or compare CSS output, run lint diagnostics, request syntax suggestions, apply reviewed fix previews, and route Master CSS repository contributor work through deterministic context tools.

## Installation

```bash
npm install -D @master/css-mcp
```

You can also run it directly:

```bash
npx -y @master/css-mcp@rc --root /absolute/path/to/project
```

## MCP client config

Most MCP clients accept a command and arguments for stdio servers:

```json
{
  "mcpServers": {
    "master-css": {
      "command": "npx",
      "args": ["-y", "@master/css-mcp@rc", "--root", "/absolute/path/to/project"]
    }
  }
}
```

Use an absolute `--root` path so the server resolves the intended workspace.

## Project tools

| Tool | Use |
| --- | --- |
| `mastercss_workspace_info` | Report workspace roots, resolved packages, and manifest status. |
| `mastercss_setup_audit` | Audit package, entry stylesheet, manifest, integration, and package-resolution setup. |
| `mastercss_inspect_class` | Inspect one class and return generated rules and CSS text. |
| `mastercss_trace_class` | Trace one class through source extraction, scanner state, missing CSS classification, and generated rules. |
| `mastercss_extract_classes` | Extract class positions and validation summaries from files or an in-memory source buffer. |
| `mastercss_inspect_directives` | Inspect CSS-first directives and report manifest, dependency, warning, and CSS effects. |
| `mastercss_render_css` | Generate CSS from HTML or a class list. |
| `mastercss_scan_project` | Scan sources, check optional classes, and report scanner state, stylesheet entries, generated CSS metadata, and missing CSS diagnostics. |
| `mastercss_manifest_query` | Query active manifest tokens, utilities, variants, modes, at-rules, and aliases. |
| `mastercss_css_compare` | Compare generated CSS for before/after class lists, HTML fragments, or source buffers. |
| `mastercss_lint_project` | Run class-list diagnostics for workspace files without writing files. |
| `mastercss_lint_content` | Run class-list diagnostics on an in-memory source buffer without writing files. |
| `mastercss_suggest_syntax` | Return language-service completions and hover context. |
| `mastercss_preview_fixes` | Create a diff preview and confirmation token. |
| `mastercss_preview_directive_format` | Preview Master CSS directive formatting for files, or format in-memory content without writing. |
| `mastercss_apply_preview` | Apply a preview after token, hash, and workspace checks. |

## Contributor tools

These read-only tools are for Master CSS repository contributors, AI coding agents, review bots, and CI support. They expose repository-specific routing as low-token JSON instead of asking an agent to repeatedly infer package ownership, risk, and validation from raw files. In non-Master CSS workspaces they return limited package data instead of guessing.

| Tool | Use |
| --- | --- |
| `mastercss_repo_context` | Route changed paths or a diff to affected packages, required context files, risks, and validation commands. |
| `mastercss_change_impact` | Summarize contributor change risk for CSS output, runtime, extraction, language tooling, ESLint, docs, and package boundaries. |
| `mastercss_test_router` | Return focused validation commands for contributor changes. |
| `mastercss_package_graph` | Report workspace package ownership, scripts, exports, workspace dependencies, and dependents. |

## Prompt templates

| Prompt | Use |
| --- | --- |
| `debug-missing-css` | Debug scanner coverage, manifest loading, invalid syntax, native CSS pruning, and stylesheet entry configuration. |
| `review-mastercss-classes` | Review class lists and propose only safe, scoped write previews. |
| `migrate-to-mastercss` | Audit an existing styling system and produce an incremental migration plan before editing. |

Use `migrate-to-mastercss` when an MCP-capable AI client is helping migrate CSS, CSS Modules, Sass, Tailwind CSS, CSS-in-JS, component-library styling, or Master CSS v1. The prompt asks the agent to inspect the workspace first, identify stylesheet entries and source extraction coverage, recommend a rendering mode, choose the first reviewable migration batch, and list validation commands and visual review risks.

The migration prompt is a planning workflow, not a one-shot converter. Keep the previous styling system in place until each migrated slice builds, runs, and visually matches the old UI.

## Machine-readable results

Project scan, lint, setup audit, directive inspection, class extraction, class tracing, CSS comparison, manifest query, and contributor routing reports use `version: 1`. Tooling can rely on stable top-level fields such as `version`, `root`, `manifest`, `inputs`, `files`, `diagnostics`, `risks`, `validation`, and `summary` when present. Nested diagnostic `data` objects may gain additional fields over time.

## Safety

Read-only tools do not write files. File writes use a two-step preview/apply flow, validate workspace containment, and verify original file hashes before writing. Lint fixes, generated CSS output writes, and directive formatting for files all use preview tokens before `mastercss_apply_preview` can write anything.

## Related docs

- [MCP Server guide](https://rc.css.master.co/guide/mcp-server)
- [AI Coding guide](https://rc.css.master.co/guide/ai-coding)
