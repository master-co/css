# Master CSS MCP Server

Model Context Protocol server for Master CSS tooling. It lets AI clients inspect a Master CSS workspace, audit setup, read the active project manifest, inspect CSS-first directives, trace classes through extraction and generated CSS, render or compare CSS output, run lint diagnostics, request syntax suggestions, and apply reviewed fix previews.

## Installation

Use Node.js 24.

```bash
npm install -D @master/css-mcp
```

You can also run it directly:

```bash
npx -y @master/css-mcp@latest --root /absolute/path/to/project
```

## MCP client config

Most MCP clients accept a command and arguments for stdio servers:

```json
{
  "mcpServers": {
    "master-css": {
      "command": "npx",
      "args": ["-y", "@master/css-mcp@latest", "--root", "/absolute/path/to/project"]
    }
  }
}
```

Use an absolute `--root` path so the server resolves the intended workspace.

To verify the connection in an empty workspace, call `mastercss_inspect_class` with:

```json
{"className": "p-md", "context": "preset"}
```

Read `result.data.css` in the response. It contains `.p-md{padding:var(--spacing-md)}`.
The `preset` context uses the bundled Master CSS defaults, so this check works before you set up a project.

## Project tools

| Tool | Use |
| --- | --- |
| `mastercss_suggest_classes` | Suggest project-aware classes for an isolated CSS declaration block without writing files. Preserves the block when conversion needs review; checks declaration output, not surrounding cascade or browser rendering. |
| `mastercss_workspace_info` | Report workspace roots, resolved packages, and manifest status. |
| `mastercss_setup_audit` | Audit package, entry stylesheet, manifest, integration, and package-resolution setup. |
| `mastercss_inspect_class` | Inspect one class and return generated rules and CSS text. |
| `mastercss_trace_class` | Trace one class through source extraction, scanner state, missing CSS classification, and generated rules. |
| `mastercss_extract_classes` | Extract class positions and validation summaries from files or an in-memory source buffer. |
| `mastercss_inspect_directives` | Inspect CSS-first directives and report manifest, dependency, warning, and CSS effects. |
| `mastercss_render_css` | Generate CSS from HTML or a class list. |
| `mastercss_scan_project` | Scan sources, check optional classes, and report scanner state, stylesheet entries, generated CSS metadata, and missing CSS diagnostics. Optionally inspect stylesheet token references and design policies. |
| `mastercss_manifest_query` | Query active manifest tokens, utilities, mixins, custom media, and token families. |
| `mastercss_css_compare` | Compare class/content output under one manifest, or two resolved project snapshots including definition changes and known consumers. |
| `mastercss_lint_project` | Run class-list diagnostics for workspace files without writing files. |
| `mastercss_lint_content` | Run class-list diagnostics on an in-memory source buffer without writing files. |
| `mastercss_suggest_syntax` | Return language-service completions and hover context. |
| `mastercss_preview_fixes` | Create a diff preview and confirmation token. |
| `mastercss_preview_directive_format` | Preview Master CSS directive formatting for files, or format in-memory content without writing. |
| `mastercss_apply_preview` | Apply a preview after token, hash, and workspace checks. |

`@theme` defines utility tokens with direct custom-property declarations and optional `static` / `inline` modifiers. Native CSS controls scoped overrides and does not add utility candidates. Directive inspection and manifest queries report the same Rust-backed contract as the compiler and language service.

## Inspect token use in stylesheets

Pass `designSystem` to `mastercss_scan_project` with the default project context to include a version 1 report in `result.data.designSystem`. This option cannot be combined with `context: "preset"`:

```json
{
  "designSystem": {
    "version": 1,
    "metadata": {
      "--color-brand-old": {
        "description": "Previous brand color",
        "deprecated": true,
        "replacement": "--color-brand"
      }
    },
    "rawValuePolicy": {
      "requireProperties": ["color", "background-color"]
    }
  }
}
```

The report covers project-owned CSS reached from the project's Master CSS entries, plus any `routeStylesheets` globs for stylesheets imported from JavaScript. It includes authored `var()` reference ranges in UTF-16 offsets, selector and at-rule ancestry, source importers, token-family collisions, each component class's attribute vocabulary (`components`), and diagnostics for the supplied metadata and raw-value policy. Ordinary native CSS can reference the same `@theme` tokens as Master CSS classes. Unregistered custom properties may come from native CSS or inheritance and are not automatically missing-token errors.

Metadata and policies are analysis inputs: they do not change generated CSS, manifests, or runtime programs. Unrecognized option fields are rejected. Omit `rawValuePolicy` to skip native declaration raw-value checks. Read `project.excluded` and `coverage`: package sources and files outside the project root are excluded, importer links include reference-only context, and the report does not establish DOM usage, cascade winners, computed styles, or browser behavior. `includeSnapshot` remains available in the same call.

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

- [MCP Server guide](https://css.master.co/guide/ai-coding#connect-the-mcp-server)
- [AI Coding guide](https://css.master.co/guide/ai-coding)


## Compare a project before and after editing

Call `mastercss_scan_project` with `includeSnapshot: true` before editing and save `result.data.snapshot`. Repeat after editing, then pass the two objects to `mastercss_css_compare` as `beforeSnapshot` and `afterSnapshot`. Both are required; snapshot inputs cannot be mixed with class/content, `filePath` or `context` inputs.

The project result is `{ version: 3, mode: 'project', comparison }` inside the usual version 3 envelope. `comparison.version` is 1. It reports changed definitions, known class consumers and files, before/after generated rules, native references, output assets and delivery order. Read `coverage` even when there are no differences: dynamic sources, remote content, binary assets and final browser behavior are not exhaustively checked. Native consumers are conservative at stylesheet granularity.

These tools use the installed compiler. Check workspace package versions, language/binding versions and manifest metadata before using documentation or examples; use the project-local, lockfile-pinned MCP package for reproducible sessions.
