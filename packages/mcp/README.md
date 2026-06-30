# Master CSS MCP Server

Model Context Protocol server for Master CSS tooling. It lets AI clients inspect a Master CSS workspace, read the active project manifest, scan source files, inspect classes, render generated CSS, run lint diagnostics, request syntax suggestions, apply reviewed fix previews, and route Master CSS repository contributor work through deterministic context tools.

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
| `mastercss_inspect_class` | Inspect one class and return generated rules and CSS text. |
| `mastercss_render_css` | Generate CSS from HTML or a class list. |
| `mastercss_scan_project` | Scan sources, check optional classes, and report scanner state, stylesheet entries, generated CSS metadata, and missing CSS diagnostics. |
| `mastercss_lint_project` | Run class-list diagnostics for workspace files without writing files. |
| `mastercss_lint_content` | Run class-list diagnostics on an in-memory source buffer without writing files. |
| `mastercss_suggest_syntax` | Return language-service completions and hover context. |
| `mastercss_preview_fixes` | Create a diff preview and confirmation token. |
| `mastercss_apply_preview` | Apply a preview after token, hash, and workspace checks. |

## Contributor tools

These read-only tools are for Master CSS repository contributors, AI coding agents, review bots, and CI support. They expose repository-specific routing as low-token JSON instead of asking an agent to repeatedly infer package ownership, risk, and validation from raw files. In non-Master CSS workspaces they return limited package data instead of guessing.

| Tool | Use |
| --- | --- |
| `mastercss_repo_context` | Route changed paths or a diff to affected packages, required context files, risks, and validation commands. |
| `mastercss_change_impact` | Summarize contributor change risk for CSS output, runtime, extraction, language tooling, ESLint, docs, and package boundaries. |
| `mastercss_test_router` | Return focused validation commands for contributor changes. |
| `mastercss_package_graph` | Report workspace package ownership, scripts, exports, workspace dependencies, and dependents. |

## Machine-readable results

Project scan, lint, and contributor routing reports use `version: 1`. Tooling can rely on stable top-level fields such as `version`, `root`, `manifest`, `inputs`, `files`, `diagnostics`, `risks`, `validation`, and `summary` when present. Nested diagnostic `data` objects may gain additional fields over time.

## Safety

Read-only tools do not write files. File writes use a two-step preview/apply flow, validate workspace containment, and verify original file hashes before writing.

## Related docs

- [MCP Server guide](https://rc.css.master.co/guide/mcp-server)
- [AI Coding guide](https://rc.css.master.co/guide/ai-coding)
