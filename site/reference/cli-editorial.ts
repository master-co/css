export interface CLIEditorial {
  introduction: string
  effects: string
  output: string
  examples: { description: string, command: string }[]
}
const sourceScope = 'Run from the project root. Omit source paths for ordinary source discovery, or quote a path/glob argument to scope the scan. Explicit paths replace the default file selection; they are not additional includes.'
const reports = 'The default `--format json` writes a versioned report to stdout. `--format stylish` writes human-readable output to stderr. With the default `--exit-code diagnostics`, errors produce a nonzero status; warnings do so when their count exceeds `--max-warnings`. `--exit-code never` suppresses diagnostic-based failure, so read the report before treating the command as a passing check. Argument and process failures can still fail.'

export const cliEditorial: Record<string, CLIEditorial> = {
  generate: {
    introduction: sourceScope + ' The generated output combines discovered stylesheet entries and scanned classes.',
    effects: 'By default, the command publishes `master.css` or the path selected by `--output`. A stylesheet graph can also publish associated stylesheets and resources beside that output. `--no-export` prints CSS without publishing those files.\n\n`--watch` keeps scanning for changes until interrupted. A failed rebuild is reported on stderr while the watcher remains active; a running watcher alone does not establish that its latest rebuild succeeded.',
    output: 'With `--no-export`, CSS goes to stdout. Scanner progress also uses stdout at the default verbosity; add `--verbose 0` when piping or saving CSS. Export notices and watch status go to stderr. Generate has no JSON diagnostic format or diagnostic exit-code switches; use `lint` or `inspect` for those reports. Review errors and the generated stylesheet before loading it into the application.',
    examples: [
      { description: 'Inspect generated CSS without writing output files:', command: "master-css generate \\\n  --no-export \\\n  --verbose 0" },
      { description: 'Publish CSS to an explicit file:', command: "master-css generate \\\n  --output master.css" },
      { description: 'Regenerate that output when project sources change; stop with Ctrl+C:', command: "master-css generate \\\n  --watch \\\n  --output master.css" }
    ]
  },
  lint: {
    introduction: sourceScope + ' This command runs native class diagnostics; it does not load the project’s ESLint configuration.',
    effects: 'Without `--fix`, source files remain unchanged. `--fix` applies supported class-list fixes, then reports remaining diagnostics. `--fix-dry-run` prevents writes even when `--fix` is also present. Add `--fix-directives` only when structural directive rewrites are intended.\n\n`--stdin` reads a buffer instead of project files; `--stdin-filepath` supplies its language context and defaults to `stdin.html`. Stdin buffers are not written back to disk, even with `--fix`.',
    output: reports + '\n\nThe JSON report contains `cwd`, `manifest`, `files`, and `summary`. Clean files are omitted from `files`; diagnostic records may contain fix proposals. This report is not a complete before/after file diff. Use the MCP preview workflow when you need full proposed file contents before applying them.',
    examples: [
      { description: 'Inspect class-order proposals in one existing source file:', command: "master-css lint \"src/button.html\" \\\n  --rules sort-classes \\\n  --fix-dry-run" },
      { description: 'Apply those class-order fixes after reviewing the proposals:', command: "master-css lint \"src/button.html\" \\\n  --rules sort-classes \\\n  --fix" },
      { description: 'Inspect a source buffer on stdin without modifying its virtual file:', command: "master-css lint --stdin \\\n  --stdin-filepath src/button.html \\\n  --rules sort-classes <<'HTML'\n<button class=\"p-md flex\">\n  Save\n</button>\nHTML" }
    ]
  },
  migrate: {
    introduction: 'Upgrade a project from its saved v2 RC language contract. Choose `--from rc-legacy` before named tokens or `--from rc-named` after named tokens and before the final conditions/modes contract. Record the actual original package version with `--source-version`; the example version must be replaced if it differs. Save the resolved original manifest before upgrading; RC versions can differ. See [Migrating from Master CSS v2 RC](/guide/migration/v2-rc).',
    effects: 'The default operation only proposes edits. `--write` applies verified edits only when the entire selected batch has no review diagnostics. Dynamic classes, selector references, ambiguous names, and uncertain cascade changes require manual review. Missing or invalid original configuration stops the command before writing.',
    output: 'JSON stdout contains `version: 2`, `from`, `sourceVersion`, `configurationCSS`, `notes`, `mode`, `manifest`, and per-file `edits`, `review`, and `written` results. Read all review diagnostics. `--manifest` selects the saved RC manifest; `--target-manifest` supplies a migrated manifest for custom utilities. Without a target file, the new preset is combined with original project token resources for equivalence checking.',
    examples: [
      { description: 'Preview an upgrade using the saved original manifest:', command: 'master-css migrate src app.css --from rc-legacy --source-version 2.0.0-rc.87 --manifest master.rc.manifest.json' },
      { description: 'Apply a reviewed batch with no unresolved diagnostics:', command: 'master-css migrate src app.css --from rc-legacy --source-version 2.0.0-rc.87 --manifest master.rc.manifest.json --write' },
      { description: 'Verify custom definitions against their migrated manifest:', command: 'master-css migrate src app.css --from rc-legacy --source-version 2.0.0-rc.87 --manifest master.rc.manifest.json --target-manifest master.v2.manifest.json' }
    ]
  },
  inspect: {
    introduction: sourceScope + ' Use this report to connect missing CSS to source discovery, stylesheet entries, and generated output.',
    effects: 'This command reads sources and composes an inspection report without publishing CSS or rewriting source files. `--classes` requests checks against the scan output; it does not add those classes to source or safelist them. `--include-css` adds the generated text to the report.\n\nInspect the returned stylesheet entries and diagnostics for project configuration. In the current standalone path, entry discovery and inspection have limitations with package-backed entries; an empty result does not prove that no CSS is needed. See [Authoring Packages](/guide/authoring-packages#use-the-package) for the documented boundary.',
    output: reports + '\n\nThe JSON report includes `cwd`, `inputs`, `files`, `scanner`, `stylesheets`, `css`, `missingCSS`, `diagnostics`, and `summary`. Check `missingCSS.present` and `missingCSS.missing` alongside the actual entries and diagnostics. `css.text` is included only when requested.',
    examples: [
      { description: 'Check a class used by an existing source file and include generated CSS:', command: "master-css inspect \\\n  \"src/button.html\" \\\n  --classes \"p-md\" \\\n  --include-css" },
      { description: 'Read a human-readable report on stderr:', command: "master-css inspect \\\n  --classes \"p-md\" \\\n  --format stylish" },
      { description: 'Save JSON for automation while retaining diagnostic-based exit status:', command: "master-css inspect \\\n  --include-css > inspection.json" }
    ]
  }
}
