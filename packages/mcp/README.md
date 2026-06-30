# Master CSS MCP Server

Model Context Protocol server for Master CSS tooling. It lets AI clients inspect a Master CSS workspace, read the active project manifest, scan source files, inspect classes, render generated CSS, run lint diagnostics, request syntax suggestions, and apply reviewed fix previews.

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

## Tools

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

## Machine-readable results

Project scan and lint reports use `version: 1`. Tooling can rely on stable top-level fields such as `version`, `root`, `manifest`, `inputs`, `files`, `diagnostics`, and `summary` when present. Nested diagnostic `data` objects may gain additional fields over time.

## Safety

Read-only tools do not write files. File writes use a two-step preview/apply flow, validate workspace containment, and verify original file hashes before writing.

## Related docs

- [MCP Server guide](https://rc.css.master.co/guide/mcp-server)
- [AI Coding guide](https://rc.css.master.co/guide/ai-coding)
