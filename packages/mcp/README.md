# Master CSS MCP Server

Model Context Protocol server for Master CSS tooling. It lets AI clients inspect a Master CSS workspace, audit setup, read the active project manifest, inspect CSS-first directives, trace classes through extraction and generated CSS, render or compare CSS output, run lint diagnostics, request syntax suggestions, read and check the component contracts of a design system, and apply reviewed fix previews.

## Installation

Use Node.js 24 or later.

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
| `mastercss_contract_list` | List the component contracts of the workspace's design-system dependencies, merged with the project's own. Filter by `query`, `tier`, or `category`. |
| `mastercss_contract_get` | Return one full contract and its source by contract name or by any class it defines. |
| `mastercss_contract_check` | Check an in-memory source buffer or workspace files against the contracts with the checker a design-system dependency declares, without writing files. |
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

## Contracts of a design system

A design system built on Master CSS can describe each component in a contract: its classes and where they go, its states, public properties and smallest correct markup. The contract tools serve those contracts from the same server, so an agent can read a component's contract before writing its markup and check the result afterward. [`@master/ui`](https://ui.master.co) is the first library that ships contracts this way.

A library declares its contracts in its own `package.json`:

```json
{
  "name": "your-design-system",
  "masterCSS": {
    "contracts": "./dist/contracts.json",
    "check": "./check/index.js"
  }
}
```

- `contracts` is a path inside the package to a JSON file holding `{ "contracts": [...] }`. A contract is an object with a string `name` and a `classes` array; every other field belongs to the library.
- `check` is optional: a path inside the package to an ES module that exports `check(source, contracts, { knows, strict })` and returns diagnostics with `code`, `severity`, `message`, `line`, `column` and, when they apply, `className` and `contract`.

The server reads `dependencies`, `devDependencies` and `peerDependencies` from the `package.json` in the workspace root, resolves each package from that root and keeps those that declare `masterCSS.contracts`. Packages that do not resolve or do not declare the field are skipped. When none declares contracts, the server reads the same fields of the monorepo root above: the nearest directory whose `package.json` lists `workspaces` or that holds a `pnpm-workspace.yaml`, without leaving the repository.

A project adds contracts of its own with globs in the same field of its root `package.json`, one contract per JSON file:

```json
{
  "masterCSS": {
    "contracts": ["contracts/*.json"]
  }
}
```

A project with a `master-ui.json` also contributes the JSON files of its `directory` (`ui` by default) and its `contracts` globs. A project contract replaces a library contract of the same `name`. Every contract in a result carries its `source`: `{ "kind": "package", "package", "version" }`, or `{ "kind": "project", "file" }` with `replaces` naming the library contract it took over.

| Call | Result |
| --- | --- |
| `mastercss_contract_list` with optional `query`, `tier`, `category` | `libraries` (name, version, contract count, whether it has a checker) and a compact `contracts` list. Nothing declaring contracts is an empty list with a `note`, not an error. |
| `mastercss_contract_get` with `name` | The full `contract` and its `source`. `name` is a contract name or any class in a contract, so `btn-primary` returns the button contract. An unknown name is an error that lists the closest contract and class names. |
| `mastercss_contract_check` with `content` and optional `filePath`, or `patterns` | Diagnostics per file, a `summary`, `coverage`, and the `checkers` that ran. Without input it checks the project's markup files. |

A library in its own repository can declare `masterCSS.check` in the root `package.json` too; that checker then reads the contracts its root `masterCSS.contracts` globs select.

`mastercss_contract_check` runs code from the package that declares the checker. The server imports it only from a path inside that package, runs it in a worker thread, and stops it with `CONTRACT_CHECKER_FAILED` when one file takes longer than 10 seconds or the checker exceeds its memory limit. Each check loads the checker again, so an upgraded library takes effect without a restart.

`mastercss_contract_check` passes the checker `knows(className)`, which answers from the project manifest whether a class is a valid Master CSS class or a native class of the project's stylesheets, and `strict: true` only when that manifest loaded; `classValidation` and `strict` in the result say which happened. When contracts exist but no library declares a checker, `coverage.status` is `no-checker` and lookups still work. With several libraries, each checker reads its own library's contracts as the project replaced them, and contracts no checker owns go to the first one.

## Prompt templates

| Prompt | Use |
| --- | --- |
| `debug-missing-css` | Debug scanner coverage, manifest loading, invalid syntax, native CSS pruning, and stylesheet entry configuration. |
| `review-mastercss-classes` | Review class lists and propose only safe, scoped write previews. |
| `migrate-to-mastercss` | Plan a conversion from CSS, CSS Modules, Sass, Tailwind CSS, CSS-in-JS or component-library styling to current Master CSS. |

## Machine-readable results

Every tool returns a `version: 3` envelope with `metadata`, `diagnostics` and `result`. Success data lives in `result.data`; failures have `result.status: "error"` and an error code and message, and set MCP `isError`. JSON text matches `structuredContent`. Metadata identifies the actual context, manifest and package contracts; read the tool’s published output schema for its payload.

## Safety

Read-only tools do not write files. `mastercss_contract_check` is the one tool that runs code from the workspace: it imports the checker module of a package that is a declared dependency of the workspace root, only from a path inside that package, and runs it in the server process. Project contract files are read as data and never executed. Restart the server after upgrading a library so that its checker is loaded again.

File writes use a two-step preview/apply flow, validate workspace containment, and verify original file hashes before writing. Lint fixes, generated CSS output writes, and directive formatting for files all use preview tokens before `mastercss_apply_preview` can write anything.

Concurrent applies coordinate across MCP processes for the same OS user through a local lock directory under `~/.cache/mastercss`. Hash validation and writes run one apply at a time across all workspace roots. A waiting apply times out after 30 seconds without taking over a live writer; its token can be retried until it expires. External editors do not participate in this lock, so edits made after hash validation can still race with apply. Multi-file writes are sequential and do not provide rollback or crash atomicity.

## Related docs

- [MCP Server guide](https://css.master.co/guide/ai-coding#connect-the-mcp-server)
- [AI Coding guide](https://css.master.co/guide/ai-coding)


## Compare a project before and after editing

Call `mastercss_scan_project` with `includeSnapshot: true` before editing and save `result.data.snapshot`. Repeat after editing, then pass the two objects to `mastercss_css_compare` as `beforeSnapshot` and `afterSnapshot`. Both are required; snapshot inputs cannot be mixed with class/content, `filePath` or `context` inputs.

The project result is `{ version: 3, mode: 'project', comparison }` inside the usual version 3 envelope. `comparison.version` is 1. It reports changed definitions, known class consumers and files, before/after generated rules, native references, output assets and delivery order. Read `coverage` even when there are no differences: dynamic sources, remote content, binary assets and final browser behavior are not exhaustively checked. Native consumers are conservative at stylesheet granularity.

These tools use the installed compiler. Check workspace package versions, language/binding versions and manifest metadata before using documentation or examples; use the project-local, lockfile-pinned MCP package for reproducible sessions.
