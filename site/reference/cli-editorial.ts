import { referenceText as text } from './copy'
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
        "description": text("tools/cli", "editorial-suggest-examples-0-description"),
        "command": "master-css suggest 'display:flex; align-items:center; padding:16px; gap:1rem;'"
      },
      {
        "description": text("tools/cli", "editorial-suggest-examples-1-description"),
        "command": "master-css suggest --stdin <<'CSS'\ndisplay:flex; align-items:center; padding:16px; gap:1rem;\nCSS"
      }
    ],
    "notes": [
      text("tools/cli", "editorial-suggest-notes-0"),
      text("tools/cli", "editorial-suggest-notes-1"),
      text("tools/cli", "editorial-suggest-notes-2"),
      text("tools/cli", "editorial-suggest-notes-3")
    ]
  },
  "generate": {
    "notes": [
      text("tools/cli", "editorial-generate-notes-0"),
      text("tools/cli", "editorial-generate-notes-1"),
      text("tools/cli", "editorial-generate-notes-2")
    ],
    "examples": [
      {
        "description": text("tools/cli", "editorial-generate-examples-0-description"),
        "command": "master-css generate \\\n  --no-export \\\n  --verbose 0"
      },
      {
        "description": text("tools/cli", "editorial-generate-examples-1-description"),
        "command": "master-css generate \\\n  --output master.css"
      },
      {
        "description": text("tools/cli", "editorial-generate-examples-2-description"),
        "command": "master-css generate \\\n  --watch \\\n  --output master.css"
      }
    ]
  },
  "lint": {
    "notes": [
      text("tools/cli", "editorial-lint-notes-0"),
      text("tools/cli", "editorial-lint-notes-1"),
      text("tools/cli", "editorial-lint-notes-2")
    ],
    "examples": [
      {
        "description": text("tools/cli", "editorial-lint-examples-0-description"),
        "command": "master-css lint \"src/button.html\" \\\n  --rules sort-classes \\\n  --fix-dry-run"
      },
      {
        "description": text("tools/cli", "editorial-lint-examples-1-description"),
        "command": "master-css lint \"src/button.html\" \\\n  --rules sort-classes \\\n  --fix"
      },
      {
        "description": text("tools/cli", "editorial-lint-examples-2-description"),
        "command": "master-css lint --stdin \\\n  --stdin-filepath src/button.html \\\n  --rules sort-classes <<'HTML'\n<button class=\"p-md flex\">\n  Save\n</button>\nHTML"
      }
    ]
  },
  "inspect": {
    "examples": [
      {
        "description": text("tools/cli", "editorial-inspect-examples-0-description"),
        "command": "master-css inspect \\\n  \"src/button.html\" \\\n  --classes \"p-md\" \\\n  --include-css"
      },
      {
        "description": text("tools/cli", "editorial-inspect-examples-1-description"),
        "command": "master-css inspect \\\n  --classes \"p-md\" \\\n  --format stylish"
      },
      {
        "description": text("tools/cli", "editorial-inspect-examples-2-description"),
        "command": "master-css inspect \\\n  --include-css > inspection.json"
      },
      {
        "description": text("tools/cli", "editorial-inspect-examples-3-description"),
        "command": "master-css inspect \\\n  --design-system"
      },
      {
        "description": text("tools/cli", "editorial-inspect-examples-4-description"),
        "command": "master-css inspect \\\n  --design-system \\\n  --design-system-options design-system.json"
      },
      {
        "description": text("tools/cli", "editorial-inspect-examples-5-description"),
        "command": "master-css inspect \\\n  --design-system \\\n  \"app/**/*.css\""
      }
    ],
    "notes": [
      text("tools/cli", "editorial-inspect-notes-0"),
      text("tools/cli", "editorial-inspect-notes-1"),
      text("tools/cli", "editorial-inspect-notes-2"),
      text("tools/cli", "editorial-inspect-notes-3"),
      text("tools/cli", "editorial-inspect-notes-4"),
      text("tools/cli", "editorial-inspect-notes-5"),
      text("tools/cli", "editorial-inspect-notes-6"),
      text("tools/cli", "editorial-inspect-notes-7")
    ]
  }
}
