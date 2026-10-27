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
| `mastercss_manifest_query` | Query active manifest tokens, utilities, mixins, custom media, and token families. |
| `mastercss_css_compare` | Compare class/content output under one manifest, or two resolved project snapshots including definition changes and known consumers. |
| `mastercss_lint_project` | Run class-list diagnostics for workspace files without writing files. |
| `mastercss_lint_content` | Run class-list diagnostics on an in-memory source buffer without writing files. |
| `mastercss_suggest_syntax` | Return language-service completions and hover context. |
| `mastercss_preview_fixes` | Create a diff preview and confirmation token. |
| `mastercss_preview_directive_format` | Preview Master CSS directive formatting for files, or format in-memory content without writing. |
| `mastercss_apply_preview` | Apply a preview after token, hash, and workspace checks. |

`@theme` defines utility tokens with direct custom-property declarations and optional `static` / `inline` modifiers. Native CSS controls scoped overrides and does not add utility candidates. Directive inspection and manifest queries report the same Rust-backed contract as the compiler and language service.

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
| `migrate-to-mastercss` | Plan a conversion from CSS, CSS Modules, Sass, Tailwind CSS, CSS-in-JS or component-library styling to current Master CSS. |

## Machine-readable results

Every tool returns a `version: 3` envelope with `metadata`, `diagnostics` and `result`. Success data lives in `result.data`; failures have `result.status: "error"` and an error code and message, and set MCP `isError`. JSON text matches `structuredContent`. Metadata identifies the actual context, manifest and package contracts; read the tool’s published output schema for its payload.

## Safety

Read-only tools do not write files. File writes use a two-step preview/apply flow, validate workspace containment, and verify original file hashes before writing. Lint fixes, generated CSS output writes, and directive formatting for files all use preview tokens before `mastercss_apply_preview` can write anything.

Concurrent applies coordinate across MCP processes for the same OS user through a local lock directory under `~/.cache/mastercss`. Hash validation and writes run one apply at a time across all workspace roots. A waiting apply times out after 30 seconds without taking over a live writer; its token can be retried until it expires. External editors do not participate in this lock, so edits made after hash validation can still race with apply. Multi-file writes are sequential and do not provide rollback or crash atomicity.

## Related docs

- [MCP Server guide](https://rc.css.master.co/guide/mcp-server)
- [AI Coding guide](https://rc.css.master.co/guide/ai-coding)


## Compare a project before and after editing

Call `mastercss_scan_project` with `includeSnapshot: true` before editing and save `result.data.snapshot`. Repeat after editing, then pass the two objects to `mastercss_css_compare` as `beforeSnapshot` and `afterSnapshot`. Both are required; snapshot inputs cannot be mixed with class/content, `filePath` or `context` inputs.

The project result is `{ version: 3, mode: 'project', comparison }` inside the usual version 3 envelope. `comparison.version` is 1. It reports changed definitions, known class consumers and files, before/after generated rules, native references, output assets and delivery order. Read `coverage` even when there are no differences: dynamic sources, remote content, binary assets and final browser behavior are not exhaustively checked. Native consumers are conservative at stylesheet granularity.

These tools use the installed compiler. Check workspace package versions, language/binding versions and manifest metadata before using documentation or examples; use the project-local, lockfile-pinned MCP package for reproducible sessions.
