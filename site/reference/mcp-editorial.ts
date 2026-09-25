export interface ToolEditorial {
  purpose: string
  fields: Record<string, string>
  example: Record<string, unknown>
  exampleNote: string
  output: string
  lifecycle: string
}
const context = 'Semantic context. Defaults to `project`; entry discovery or compilation failures are reported without falling back. Select `preset` explicitly for standalone preset queries.'
const patterns = 'Source paths or glob patterns relative to the server root. Omit to use the tool’s default source scope. Absolute patterns and parent traversal are rejected.'
const className = 'One complete Master CSS class, including any selector or condition suffix.'
const mode = 'Mode passed to class inspection. Omit to use the active manifest’s default behavior.'
const rules = 'Comma-separated native lint rule IDs, `recommended`, or `all`. These tools do not load an ESLint configuration.'
const filePath = 'Virtual workspace-relative path used to infer the source language; the buffer does not need to exist on disk.'
const ttlMs = 'Preview lifetime in milliseconds. Omit to use the server’s `--preview-ttl` setting, which defaults to 300000 (5 minutes).'
const previewLife = 'Workspace files stay unchanged until `mastercss_apply_preview`. A nonempty preview stores a token in this server process; expiry, restart, or successful application requires a new preview. An unchanged result has no confirmation token.'
const readOnly = 'This operation does not write workspace files.'
const contributorFields = {
  task: 'Description of the contributor task. It helps select context packs; it does not select changed paths.',
  paths: 'Changed repository-relative paths. These are combined with paths extracted from `diff`.',
  diff: 'Unified diff text used to identify affected paths. The tool does not run Git or discover the current diff for you.'
}
const contributorLife = 'This operation reads repository metadata and does not edit files or run validation commands. Routing is designed for the Master CSS repository. Other workspaces report `status: limited`; missing recommendations do not establish that a change needs no checks.'
const contributorExample = { task: 'Update guide examples', paths: ['site/app/[locale]/guide/ai-coding/content.mdx'] }
const contributorNote = 'This request targets a file in the Master CSS repository. Substitute the paths you are actually changing.'

export const mcpEditorial: Record<string, ToolEditorial> = {
  mastercss_workspace_info: {
    purpose: 'Start here to confirm the server root, package resolution, and discovered CSS entries before interpreting project-dependent results.',
    fields: {}, example: {}, exampleNote: 'Call with an empty arguments object.',
    output: 'Read `root` and `roots` for workspace scope, `packages` for resolved package locations, and `manifest.status`, `manifest.entries`, `manifest.dependencies`, and `manifest.warnings` for the loaded context. Project entry discovery failure and compilation failure have distinct diagnostics; neither silently selects the preset.',
    lifecycle: readOnly
  },
  mastercss_setup_audit: {
    purpose: 'Investigate missing packages, undiscovered CSS entries, and integration configuration after checking the workspace root.',
    fields: {}, example: {}, exampleNote: 'Call with an empty arguments object.',
    output: 'Read `status`, `diagnostics`, and `summary` first. The report also includes package-manager hints, declared and resolved packages, detected integrations, and manifest entries. These are configuration checks, not proof that an application builds or renders correctly.',
    lifecycle: readOnly
  },
  mastercss_inspect_class: {
    purpose: 'Check how one class is interpreted by the active manifest. Use `mastercss_trace_class` when the question is whether project scanning actually finds it.',
    fields: { context, className, mode }, example: { className: 'p-md' }, exampleNote: 'Inspect a preset spacing class in the connected workspace.',
    output: 'The result includes `className`, `matchStatus`, `cssSyntaxStatus`, `cssValueStatus`, `browserSupport`, `rules`, semantic inspection data, and the generated `css` string. Check `manifest.status` and entries before using custom tokens. A matched class alone does not establish that it appears in scanned source.',
    lifecycle: readOnly
  },
  mastercss_trace_class: {
    purpose: 'Trace a class through source discovery, scanner state, and generated CSS to explain why it is present or missing.',
    fields: { context, className, patterns, includeCss: 'Include the full generated stylesheet text in `css.text`. Omitted by default.', mode },
    example: { className: 'p-md', patterns: ['src/button.html'], includeCss: true }, exampleNote: 'The file must exist under the server root and contain the class you want to trace.',
    output: 'Read `status`, `reason`, and `detected` together, then inspect `occurrences`, `inspection`, `scanner`, and `diagnostics`. `css` describes the scan output. A matched inspection and a detected source occurrence answer different questions.',
    lifecycle: readOnly
  },
  mastercss_extract_classes: {
    purpose: 'Find exact class tokens and source positions in a buffer, or inspect extraction across selected project files.',
    fields: { context, content: 'Source buffer to inspect. When provided, it takes precedence over project patterns, including when the string is empty.', filePath: filePath + ' Defaults to `index.html` in content mode.', patterns, includeRules: 'Include generated rules in each class inspection. Defaults to false.' },
    example: { content: '<button class="flex gap-sm p-md">Save</button>', filePath: 'src/button.html', includeRules: true }, exampleNote: 'This buffer is inspected without writing `src/button.html`.',
    output: '`files` contains language IDs and class records with tokens, ranges, locations, matching, CSS-syntax and CSS-value statuses, diagnostics, and inspection data. `inputs.mode` distinguishes content from project mode. `summary` counts files and classes; project mode also includes scanner counts and diagnostics.',
    lifecycle: readOnly
  },
  mastercss_inspect_directives: {
    purpose: 'Inspect directive structure and compilation effects from an entry stylesheet or a CSS buffer. Provide `entryPath` or `content`; an empty arguments object cannot be compiled.',
    fields: { context, content: 'CSS buffer to inspect when `entryPath` is absent.', filePath: 'Virtual path for the CSS buffer. Defaults to `master.css`.', entryPath: 'Existing stylesheet path inside the workspace. Takes precedence over `content`.', preserveNativeCSS: 'Forward the native-CSS preservation option to compilation.' },
    example: { content: '@theme { --color-brand: blue; }', filePath: 'app.css' }, exampleNote: 'Inspect an isolated token definition without changing the project entry.',
    output: 'Read `status` and `diagnostics`, then `directiveEntries`, manifest and directive summaries, CSS sizes, dependencies, and warnings. Compilation failures return the error branch of the MCP envelope with diagnostics and `isError`.',
    lifecycle: readOnly
  },
  mastercss_render_css: {
    purpose: 'Generate CSS for a small literal class list or HTML fragment using the connected project context.',
    fields: { context, html: 'HTML fragment to extract classes from. A nonempty string takes precedence over `classList`.', classList: 'Whitespace-separated complete classes. Used when `html` is absent or empty.' },
    example: { classList: 'flex gap-sm' }, exampleNote: 'Generate a small flex layout without creating a source file.',
    output: 'The result contains extracted `classes`, `invalid` class names, and `css.text` plus its UTF-8 byte count. Check the manifest status and invalid list as well as the CSS. Empty input produces no class request.',
    lifecycle: readOnly
  },
  mastercss_scan_project: {
    purpose: 'Inspect scanned files, stylesheet entries, generated CSS, and optional missing-class checks for a chosen source scope.',
    fields: { context, patterns, classes: 'Complete class names to check against the generated output. This does not add classes to source or safelist them.', includeCss: 'Include the generated stylesheet in `css.text`. Omitted by default.' },
    example: { patterns: ['src/button.html'], classes: ['p-md'], includeCss: true }, exampleNote: 'Use an existing source file. The requested class is checked against actual scan output.',
    output: 'Read `summary` and `diagnostics`, then `files`, `stylesheets`, scanner state, `css`, and `missingCSS`. The report includes the configured `root` and manifest status. Check the discovered stylesheet entries before attributing a missing rule to extraction.',
    lifecycle: readOnly
  },
  mastercss_manifest_query: {
    purpose: 'Look up registered tokens, utilities, variants, modes, conditions, and aliases in the active manifest.',
    fields: { context, query: 'Case-insensitive substring query. Omit for all entries in the selected kinds.', kind: 'Category to return. Defaults to `all`.', namespace: 'Exact namespace filter for tokens and utilities. Other categories are not filtered by namespace.', limit: 'Maximum entries returned per category, not across the whole response. Defaults to 50.' },
    example: { kind: 'token', namespace: 'color', query: 'brand', limit: 10 }, exampleNote: 'This query returns a brand color only if the loaded manifest defines one.',
    output: '`results` groups tokens, utilities, variants, modes, conditions, and aliases. `summary.total` counts matches before per-category limits, while `summary.returned` counts returned items. Check manifest errors before interpreting an empty result.',
    lifecycle: readOnly
  },
  mastercss_css_compare: {
    purpose: 'Compare two class selections using the same active manifest. The result explains generated CSS differences; it does not establish visual equivalence.',
    fields: { context,
      beforeClassList: 'Whitespace-separated classes before the change. Takes precedence over the before HTML and source buffer.',
      afterClassList: 'Whitespace-separated classes after the change. Takes precedence over the after HTML and source buffer.',
      beforeHtml: 'Before HTML fragment, used when `beforeClassList` is absent.', afterHtml: 'After HTML fragment, used when `afterClassList` is absent.',
      beforeContent: 'Before source buffer, used when both other before inputs are absent.', afterContent: 'After source buffer, used when both other after inputs are absent.',
      filePath: filePath + ' Defaults to `index.html`.'
    },
    example: { beforeClassList: 'p-sm', afterClassList: 'p-md' }, exampleNote: 'Compare two spacing values under the same manifest.',
    output: '`classes` and `rules` describe additions and removals, `invalid` lists rejected classes, and `css` includes before/after text and a diff. The current `bytes` and `bytesDelta` fields count UTF-16 code units with JavaScript string lengths, not UTF-8 bytes or compressed transfer sizes.',
    lifecycle: readOnly
  },
  mastercss_lint_project: {
    purpose: 'Run native class diagnostics over selected files. Use the project’s ESLint command separately for its parser, plugin settings, and team rules.',
    fields: { context, patterns, rules }, example: { patterns: ['src/button.html'], rules: 'sort-classes' }, exampleNote: 'Check class order in an existing file without applying a fix.',
    output: '`files` contains files with diagnostics and any fix proposals; clean files are omitted. `summary` counts diagnostics, and `manifest` identifies the loaded entries. A manifest-loading failure is reported as a diagnostic.',
    lifecycle: readOnly
  },
  mastercss_lint_content: {
    purpose: 'Check an unsaved source buffer with the native class diagnostics and the connected workspace’s manifest.',
    fields: { context, content: 'Complete source buffer to lint.', filePath, rules },
    example: { content: '<button class="p-md flex">Save</button>', filePath: 'src/button.html', rules: 'sort-classes' }, exampleNote: 'The virtual HTML path selects the source language; no file is written.',
    output: '`files` includes the buffer’s diagnostics and fix proposals, with a diagnostic `summary` and manifest status. Fix proposals are data in the result, not applied edits. Manifest-loading failures return the error envelope without selecting a preset.',
    lifecycle: readOnly
  },
  mastercss_suggest_syntax: {
    purpose: 'Request language-service completion candidates and hover information at a position in an unsaved document.',
    fields: { context, content: 'Complete source buffer.', filePath, position: 'Cursor position in the buffer.', 'position.line': 'Zero-based line index.', 'position.character': 'Zero-based UTF-16 code-unit offset on the line.', triggerCharacter: 'Character that triggered completion. Omit for an explicit completion request.', limit: 'Maximum completion items returned. Defaults to 50; `total` still reports the untruncated count.' },
    example: { content: '<div class="p:"></div>', filePath: 'src/card.html', position: { line: 0, character: 14 }, limit: 5 }, exampleNote: 'The cursor follows `p:` in the class attribute.',
    output: 'The result includes `completions`, their untruncated `total`, optional `hover`, and manifest status. A completion list is editor assistance; verify the selected class against the intended project and rendered UI.',
    lifecycle: readOnly
  },
  mastercss_preview_fixes: {
    purpose: 'Prepare a reviewable diff for native lint fixes or generated CSS output. This request does not apply its changes.',
    fields: { context, mode: 'Preview operation. Defaults to `lint-fixes`.', patterns, rules, includeDirectiveFixes: 'Allow structural directive fixes in lint mode. Defaults to false.', outputPath: 'Target path inside the workspace. Required in `generated-css` mode; its parent directory must exist.', ttlMs },
    example: { mode: 'lint-fixes', patterns: ['src/button.html'], rules: 'sort-classes' }, exampleNote: 'Review `preview.changes` and its diffs before passing a returned token to the apply tool.',
    output: '`preview` contains changed files, complete proposed text, diffs, hashes, and a summary. A changed result includes `confirmToken` and `expiresAt`. Lint mode includes a `lint` report; generated-CSS mode includes `outputPath` and a scan summary. Manifest errors return the error envelope; an error must not be interpreted as an empty successful preview.',
    lifecycle: previewLife
  },
  mastercss_preview_directive_format: {
    purpose: 'Format directives in a source buffer or create a file-formatting preview. Content mode returns formatted text directly and does not create an apply token.',
    fields: { context, content: 'Source buffer. When present, selects content mode and takes precedence over patterns.', filePath: filePath + ' Defaults to `master.css` in content mode.', patterns: 'File paths or glob patterns for file mode. Defaults to CSS, SCSS, Less, Vue, Svelte, and Astro sources outside node_modules.', range: 'Optional formatting range, using zero-based UTF-16 positions.', 'range.start': 'Inclusive start position.', 'range.start.line': 'Zero-based line index.', 'range.start.character': 'Zero-based UTF-16 code-unit offset.', 'range.end': 'Exclusive end position.', 'range.end.line': 'Zero-based line index.', 'range.end.character': 'Zero-based UTF-16 code-unit offset.', ttlMs },
    example: { content: '.card {\n  @compose background-color:transparent !;\n}', filePath: 'card.css' }, exampleNote: 'The returned `formatted` string joins the importance marker to its class without editing a file.',
    output: 'Both modes report files, edits, changed counts, and `mode`. Content mode includes `formatted`; file mode includes `inputs` and `preview`. Formatting uses the default preset language service and does not load the project manifest.',
    lifecycle: 'Content mode does not write files or store a token. In file mode, ' + previewLife[0].toLowerCase() + previewLife.slice(1)
  },
  mastercss_apply_preview: {
    purpose: 'Apply the exact changes from a reviewed preview in the same running server session. This tool writes workspace files.',
    fields: { confirmToken: 'Unexpired token returned by a changed lint, generated-CSS, or directive-format preview.' },
    example: { confirmToken: '<token-from-reviewed-preview>' }, exampleNote: 'Replace the placeholder with `preview.confirmToken` from the same server session. The placeholder itself is not a valid token.',
    output: 'A successful result has `applied: true` and `changes` containing file paths and their resulting hashes. Unknown, expired, consumed, changed-source, and out-of-root previews are rejected. Inspect tool errors before treating a change as applied.',
    lifecycle: 'The server validates all original file hashes and writable paths before writing the proposed contents. Successful application consumes the token. File writes are sequential; this is not a transactional multi-file rollback mechanism. Run project checks and inspect the changed UI afterward.'
  },
  mastercss_repo_context: {
    purpose: 'Find the owning packages, context documents, risks, and suggested checks for work inside the Master CSS repository.',
    fields: contributorFields, example: contributorExample, exampleNote: contributorNote,
    output: 'Read `status`, `affectedPackages`, `context.files`, `risks`, and `validation.commands`. The context list contains paths to read; it does not embed those documents. Source and nearby tests remain the authority for behavior.', lifecycle: contributorLife
  },
  mastercss_change_impact: {
    purpose: 'Classify the likely areas of impact for a contributor change before choosing its validation scope.',
    fields: contributorFields, example: contributorExample, exampleNote: contributorNote,
    output: '`affectedPackages` and `risks` describe matched paths and risk categories. `summary` counts risks and packages. These classifications are routing hints, not a code review or a proof that unlisted behavior is unaffected.', lifecycle: contributorLife
  },
  mastercss_test_router: {
    purpose: 'Find focused validation commands for the packages affected by a Master CSS contributor change.',
    fields: contributorFields, example: { paths: contributorExample.paths }, exampleNote: contributorNote,
    output: '`validation.commands` pairs suggested commands with reasons. The result also reports `status`, affected packages, and risks. The tool lists commands; it does not execute them or report passing tests.', lifecycle: contributorLife
  },
  mastercss_package_graph: {
    purpose: 'Inspect workspace package ownership and dependency relationships without traversing the installed node_modules tree.',
    fields: { packageName: 'Exact package name or repository-relative package path. Omit to return all discovered packages.', includeExamples: 'Include packages under `examples/`. Defaults to true.' },
    example: { includeExamples: false }, exampleNote: 'Inspect the connected workspace’s package graph without example packages.',
    output: '`packages` contains names, paths, package kinds, scripts, exports, internal workspace dependencies, dependents, and AI-note paths. `summary` counts returned packages. `status: limited` identifies a generic workspace outside the Master CSS repository.', lifecycle: contributorLife
  }
}
