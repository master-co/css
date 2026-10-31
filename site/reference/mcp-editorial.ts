/** Catalog guidance and small calls exercised by the documentation fixtures. */
export interface ToolEditorial {
  purpose: string
  example: Record<string, unknown>
  lifecycle: string
}
export const mcpEditorial: Record<string, ToolEditorial> = {
  "mastercss_workspace_info": {
    "purpose": "Start here to confirm the server root, package resolution, and discovered CSS entries before interpreting project-dependent results.",
    "example": {},
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_setup_audit": {
    "purpose": "Investigate missing packages, undiscovered CSS entries, and integration configuration after checking the workspace root.",
    "example": {},
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_inspect_class": {
    "purpose": "Check how one class is interpreted by the active manifest. Use `mastercss_trace_class` when the question is whether project scanning actually finds it.",
    "example": {
      "className": "p-md"
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_trace_class": {
    "purpose": "Trace a class through source discovery, scanner state, and generated CSS to explain why it is present or missing.",
    "example": {
      "className": "p-md",
      "patterns": [
        "src/button.html"
      ],
      "includeCss": true
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_extract_classes": {
    "purpose": "Find exact class tokens and source positions in a buffer, or inspect extraction across selected project files.",
    "example": {
      "content": "<button class=\"flex gap-sm p-md\">Save</button>",
      "filePath": "src/button.html",
      "includeRules": true
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_inspect_directives": {
    "purpose": "Inspect directive structure and compilation effects from an entry stylesheet or a CSS buffer. Provide `entryPath` or `content`; an empty arguments object cannot be compiled.",
    "example": {
      "content": "@theme { --color-brand: blue;  }",
      "filePath": "app.css"
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_render_css": {
    "purpose": "Generate CSS for a small literal class list or HTML fragment using the connected project context.",
    "example": {
      "classList": "flex gap-sm"
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_scan_project": {
    "purpose": "Inspect scanned files, stylesheet entries, generated CSS, and optional missing-class checks for a chosen source scope. Add design-system inspection to check token references and policies in managed project CSS.",
    "example": {
      "patterns": [
        "src/button.html"
      ],
      "classes": [
        "p-md"
      ],
      "includeCss": true
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_manifest_query": {
    "purpose": "Look up tokens, utilities, native mixins, custom media and canonical token families in the active manifest.",
    "example": {
      "kind": "token",
      "namespace": "color",
      "query": "brand",
      "limit": 10
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_css_compare": {
    "purpose": "Supply both project snapshots to compare independent definitions and known consumers, including edits with unchanged markup. Otherwise, compare two class selections using the same active manifest. The result explains generated CSS differences; it does not establish visual equivalence.",
    "example": {
      "beforeClassList": "p-sm",
      "afterClassList": "p-md"
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_lint_project": {
    "purpose": "Run native class diagnostics over selected files. Use the project’s ESLint command separately for its parser, plugin settings, and team rules.",
    "example": {
      "patterns": [
        "src/button.html"
      ],
      "rules": "sort-classes"
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_lint_content": {
    "purpose": "Check an unsaved source buffer with the native class diagnostics and the connected workspace’s manifest.",
    "example": {
      "content": "<button class=\"p-md flex\">Save</button>",
      "filePath": "src/button.html",
      "rules": "sort-classes"
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_suggest_syntax": {
    "purpose": "Request language-service completion candidates and hover information at a position in an unsaved document.",
    "example": {
      "content": "<div class=\"(padding:\"></div>",
      "filePath": "src/card.html",
      "position": {
        "line": 0,
        "character": 20
      },
      "limit": 5
    },
    "lifecycle": "This operation does not write workspace files."
  },
  "mastercss_preview_fixes": {
    "purpose": "Prepare a reviewable diff for native lint fixes or generated CSS output. This request does not apply its changes.",
    "example": {
      "mode": "lint-fixes",
      "patterns": [
        "src/button.html"
      ],
      "rules": "sort-classes"
    },
    "lifecycle": "Workspace files stay unchanged until `mastercss_apply_preview`. A nonempty preview stores a token in this server process; expiry, restart, or successful application requires a new preview. An unchanged result has no confirmation token."
  },
  "mastercss_preview_directive_format": {
    "purpose": "Format directives in a source buffer or create a file-formatting preview. Content mode returns formatted text directly and does not create an apply token.",
    "example": {
      "content": "@safelist \"(background-color:transparent) !\";",
      "filePath": "card.css"
    },
    "lifecycle": "Content mode does not write files or store a token. In file mode, workspace files stay unchanged until `mastercss_apply_preview`. A nonempty preview stores a token in this server process; expiry, restart, or successful application requires a new preview. An unchanged result has no confirmation token."
  },
  "mastercss_apply_preview": {
    "purpose": "Apply the exact changes from a reviewed preview in the same running server session. This tool writes workspace files.",
    "example": {
      "confirmToken": "<token-from-reviewed-preview>"
    },
    "lifecycle": "The server validates all original file hashes and writable paths before writing the proposed contents. Successful application consumes the token. File writes are sequential; this is not a transactional multi-file rollback mechanism. Run project checks and inspect the changed UI afterward."
  }
}

/** Built-in MCP prompts (`prompts/list`); the fixtures compare names with the server. */
export const mcpPrompts: { name: string, use: string }[] = [
  { name: 'debug-missing-css', use: 'Inspect scanner coverage, manifest loading, syntax, native CSS pruning and stylesheet entry configuration when classes do not produce CSS.' },
  { name: 'review-mastercss-classes', use: 'Run class diagnostics and propose only safe, scoped write previews.' },
  { name: 'migrate-to-mastercss', use: 'Audit an external styling system and plan incremental batches with a rendering mode, validation commands and visual risks; it does not edit files.' }
]

/** The result contract shared by every tool; complete schemas come from `tools/list`. */
export const mcpResultContract: string[] = [
  'Every tool returns a version 3 object with `metadata`, `diagnostics` and a required `result`. Success has `result: { status: \'success\', data }`; failure has `result: { status: \'error\', error: { code, message } }` and also sets MCP `isError`. JSON text and `structuredContent` contain the same object; validate both branches with the tool\'s `outputSchema`.',
  '`metadata` reports package, language and binding versions, the context actually used, the manifest fingerprint, entries and dependencies; unavailable values are null or empty arrays. Project context is the default: a missing entry or failed compilation is an error, never a silent switch to the preset. Pass `context: \'preset\'` explicitly for preset-only queries.',
  'Class inspection reports `matchStatus`, `cssSyntaxStatus`, `cssValueStatus` and `browserSupport` separately, and each check record names its version, phase and scope. A CSS grammar error differs from an unknown future capability, `var()` does not establish a computed value, and `browserSupport` stays `not-checked` unless a browser check ran. Known CSS math types are checked without computing lengths or converting units; distinct token definitions stay ambiguous even when their values are equal.',
  'Markdown and MDX extraction separates live markup and code from display text and returns original UTF-16 ranges with inclusion or exclusion reasons; the CLI, editor and MCP share the same Rust extraction and matching. CLI report versions are independent of this envelope. In MCP payloads `root` is the configured workspace root; in CLI reports `cwd` is the command root.',
  'Project comparison: call `mastercss_scan_project` with `includeSnapshot: true` before and after editing, then pass both `result.data.snapshot` objects to `mastercss_css_compare` as `beforeSnapshot` and `afterSnapshot`; they cannot be mixed with class, content, `filePath` or `context` inputs. The result is `{ version: 3, mode: \'project\', comparison }`, where `comparison.version` is 1 and lists changed definitions, known consumers and files, before/after rules, native references, output assets, delivery order and `coverage`. Native consumers are conservative at stylesheet granularity.',
  'Design-system inspection: `mastercss_scan_project.designSystem` takes the [design-system options](/reference/tools/cli#design-system-options) object and cannot be combined with `context: \'preset\'`. The version 1 report in `result.data.designSystem` lists authored `var()` references with source ranges, selector and at-rule ancestry, importers, token-family collisions and policy diagnostics; read `project.excluded` and `coverage`. An unregistered custom property can still resolve through native CSS and is not automatically an error.'
]
