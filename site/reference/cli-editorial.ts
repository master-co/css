/** Basic catalog examples; all calls are exercised by documentation fixtures. */
export interface CLIEditorial {
  examples: { description: string, command: string }[]
  /** Option contracts that `--help` names but does not describe. */
  notes?: string[]
}
export const cliEditorial: Record<string, CLIEditorial> = {
  "suggest": {
    "examples": [
      {
        "description": "Suggest classes from declarations using the active project manifest:",
        "command": "master-css suggest 'display:flex; align-items:center; padding:16px; gap:1rem;'"
      },
      {
        "description": "Read a declaration block from stdin:",
        "command": "master-css suggest --stdin <<'CSS'\ndisplay:flex; align-items:center; padding:16px; gap:1rem;\nCSS"
      }
    ],
    "notes": [
      "Pass one quoted declaration block or `--stdin`, never both. Select the project root with `--cwd` (default: current directory). For an argument beginning with `--`, use stdin or place `--` before the argument. Input must contain declarations only, without a selector or surrounding braces.",
      "The version 1 JSON envelope contains `cwd`, `manifest`, `result`, `validation` and `diagnostics`. `manifest.entries` lists discovered Master CSS entries; if none are found, suggestions use the default preset. A discovered entry that fails to load is an error, never a preset fallback. Check entries before relying on project tokens or utility overrides.",
      "`result` is the versioned declaration-suggestion report: classes, generated CSS, `remainingCss`, notes and verification. A `preserved` result retains the entire original block and exits successfully; keep that CSS and read its notes. A `suggested` result checks declaration correspondence, not cascade or browser rendering. Class-specific diagnostics identify `className`; `validation` separates matching, CSS syntax, CSS values and browser support.",
      "Reports always go to stdout as JSON. Errors are also written to stderr and exit with status 1. Input, manifest or execution failures return `result: null`; known invalid suggested CSS produces an error while retaining the proposal. Unknown values are not errors, and browser support remains `not-checked`. Argument-parser errors, such as unknown flags, use ordinary CLI help diagnostics."
    ]
  },
  "generate": {
    "examples": [
      {
        "description": "Inspect generated CSS without writing output files:",
        "command": "master-css generate \\\n  --no-export \\\n  --verbose 0"
      },
      {
        "description": "Publish CSS to an explicit file:",
        "command": "master-css generate \\\n  --output master.css"
      },
      {
        "description": "Regenerate that output when project sources change; stop with Ctrl+C:",
        "command": "master-css generate \\\n  --watch \\\n  --output master.css"
      }
    ]
  },
  "lint": {
    "examples": [
      {
        "description": "Inspect class-order proposals in one existing source file:",
        "command": "master-css lint \"src/button.html\" \\\n  --rules sort-classes \\\n  --fix-dry-run"
      },
      {
        "description": "Apply those class-order fixes after reviewing the proposals:",
        "command": "master-css lint \"src/button.html\" \\\n  --rules sort-classes \\\n  --fix"
      },
      {
        "description": "Inspect a source buffer on stdin without modifying its virtual file:",
        "command": "master-css lint --stdin \\\n  --stdin-filepath src/button.html \\\n  --rules sort-classes <<'HTML'\n<button class=\"p-md flex\">\n  Save\n</button>\nHTML"
      }
    ]
  },
  "inspect": {
    "examples": [
      {
        "description": "Check a class used by an existing source file and include generated CSS:",
        "command": "master-css inspect \\\n  \"src/button.html\" \\\n  --classes \"p-md\" \\\n  --include-css"
      },
      {
        "description": "Read a human-readable report on stderr:",
        "command": "master-css inspect \\\n  --classes \"p-md\" \\\n  --format stylish"
      },
      {
        "description": "Save JSON for automation while retaining diagnostic-based exit status:",
        "command": "master-css inspect \\\n  --include-css > inspection.json"
      },
      {
        "description": "Inspect token references and collisions across managed project CSS:",
        "command": "master-css inspect \\\n  --design-system"
      },
      {
        "description": "Read metadata and raw-value policy from an existing version 1 options file:",
        "command": "master-css inspect \\\n  --design-system \\\n  --design-system-options design-system.json"
      },
      {
        "description": "Add route and component stylesheets imported from JavaScript, which the CSS entry graph does not reach:",
        "command": "master-css inspect \\\n  --design-system \\\n  \"app/**/*.css\""
      }
    ],
    "notes": [
      "### Design-system options {#design-system-options}",
      "`--design-system-options` reads a JSON file and requires `--design-system`. The same object is accepted by the MCP `mastercss_scan_project` `designSystem` input (project context only) and the language server's `designSystem` setting; all three return the same report.",
      "```json name=design-system.json\n{\n  \"version\": 1,\n  \"metadata\": {\n    \"--color-brand-old\": {\n      \"description\": \"Previous brand color\",\n      \"deprecated\": true,\n      \"replacement\": \"--color-brand\"\n    }\n  },\n  \"rawValuePolicy\": {\n    \"requireProperties\": [\"color\", \"background-color\"]\n  }\n}\n```",
      "| Field | Contract |\n| --- | --- |\n| `version` | Required; `1`. |\n| `metadata` | Optional map from a token name in the active project to `description`, `deprecated` and `replacement`. Deprecation warnings cover authored CSS `var()` references; a replacement is a review suggestion and is never applied automatically. |\n| `rawValuePolicy.requireProperties` | Optional. Native declarations of these token-backed properties must use a token; a complete `var()` component, including its fallback, is exempt. Omit the policy to skip raw-value checks. |",
      "Unrecognized fields are rejected. The options only affect the inspection report, never generated CSS or browser programs. `components` lists each class's attribute vocabulary from attribute selectors in the same compound, such as `.button[data-variant=\"primary\"]`: exact `values` and whether a bare `[name]` selector exists (`presence`); attributes inside functional pseudo-classes such as `:where()` are not collected. The report covers project entries and their local dependencies, plus any stylesheets named as source paths (listed in `project.routeStylesheets`, with no importers); with `--design-system`, source paths must match `.css` files. Package CSS and files outside the project root are excluded, an `@reference` edge supplies definition context without delivery, and `browser` stays `not-checked`."
    ]
  }
}
