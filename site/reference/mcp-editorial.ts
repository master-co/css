import { referenceText as text } from './copy'
/** Catalog guidance and small calls exercised by the documentation fixtures. */
export interface ToolEditorial {
  purpose: string
  example: Record<string, unknown>
  lifecycle: string
}
export const mcpEditorial: Record<string, ToolEditorial> = {
  "mastercss_suggest_classes": {
    "purpose": text("tools/mcp", "editorial-mastercss_suggest_classes-purpose"),
    "example": { "declarations": "display:flex; padding:16px; gap:1rem;" },
    "lifecycle": text("tools/mcp", "editorial-mastercss_suggest_classes-lifecycle")
  },
  "mastercss_workspace_info": {
    "purpose": text("tools/mcp", "editorial-mastercss_workspace_info-purpose"),
    "example": {},
    "lifecycle": text("tools/mcp", "editorial-mastercss_workspace_info-lifecycle")
  },
  "mastercss_setup_audit": {
    "purpose": text("tools/mcp", "editorial-mastercss_setup_audit-purpose"),
    "example": {},
    "lifecycle": text("tools/mcp", "editorial-mastercss_setup_audit-lifecycle")
  },
  "mastercss_inspect_class": {
    "purpose": text("tools/mcp", "editorial-mastercss_inspect_class-purpose"),
    "example": {
      "className": "p-md"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_inspect_class-lifecycle")
  },
  "mastercss_trace_class": {
    "purpose": text("tools/mcp", "editorial-mastercss_trace_class-purpose"),
    "example": {
      "className": "p-md",
      "patterns": [
        "src/button.html"
      ],
      "includeCss": true
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_trace_class-lifecycle")
  },
  "mastercss_extract_classes": {
    "purpose": text("tools/mcp", "editorial-mastercss_extract_classes-purpose"),
    "example": {
      "content": "<button class=\"flex gap-sm p-md\">Save</button>",
      "filePath": "src/button.html",
      "includeRules": true
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_extract_classes-lifecycle")
  },
  "mastercss_inspect_directives": {
    "purpose": text("tools/mcp", "editorial-mastercss_inspect_directives-purpose"),
    "example": {
      "content": "@theme { --color-brand: blue;  }",
      "filePath": "app.css"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_inspect_directives-lifecycle")
  },
  "mastercss_render_css": {
    "purpose": text("tools/mcp", "editorial-mastercss_render_css-purpose"),
    "example": {
      "classList": "flex gap-sm"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_render_css-lifecycle")
  },
  "mastercss_scan_project": {
    "purpose": text("tools/mcp", "editorial-mastercss_scan_project-purpose"),
    "example": {
      "patterns": [
        "src/button.html"
      ],
      "classes": [
        "p-md"
      ],
      "includeCss": true
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_scan_project-lifecycle")
  },
  "mastercss_manifest_query": {
    "purpose": text("tools/mcp", "editorial-mastercss_manifest_query-purpose"),
    "example": {
      "kind": "token",
      "namespace": "color",
      "query": "brand",
      "limit": 10
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_manifest_query-lifecycle")
  },
  "mastercss_css_compare": {
    "purpose": text("tools/mcp", "editorial-mastercss_css_compare-purpose"),
    "example": {
      "beforeClassList": "p-sm",
      "afterClassList": "p-md"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_css_compare-lifecycle")
  },
  "mastercss_lint_project": {
    "purpose": text("tools/mcp", "editorial-mastercss_lint_project-purpose"),
    "example": {
      "patterns": [
        "src/button.html"
      ],
      "rules": "sort-classes"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_lint_project-lifecycle")
  },
  "mastercss_lint_content": {
    "purpose": text("tools/mcp", "editorial-mastercss_lint_content-purpose"),
    "example": {
      "content": "<button class=\"p-md flex\">Save</button>",
      "filePath": "src/button.html",
      "rules": "sort-classes"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_lint_content-lifecycle")
  },
  "mastercss_suggest_syntax": {
    "purpose": text("tools/mcp", "editorial-mastercss_suggest_syntax-purpose"),
    "example": {
      "content": "<div class=\"(padding:\"></div>",
      "filePath": "src/card.html",
      "position": {
        "line": 0,
        "character": 20
      },
      "limit": 5
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_suggest_syntax-lifecycle")
  },
  "mastercss_contract_list": {
    "purpose": text("tools/mcp", "editorial-mastercss_contract_list-purpose"),
    "example": {
      "query": "button"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_contract_list-lifecycle")
  },
  "mastercss_contract_get": {
    "purpose": text("tools/mcp", "editorial-mastercss_contract_get-purpose"),
    "example": {
      "name": "btn-primary"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_contract_get-lifecycle")
  },
  "mastercss_contract_check": {
    "purpose": text("tools/mcp", "editorial-mastercss_contract_check-purpose"),
    "example": {
      "content": "<button class=\"btn-primary\">Save</button>",
      "filePath": "src/button.html"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_contract_check-lifecycle")
  },
  "mastercss_preview_fixes": {
    "purpose": text("tools/mcp", "editorial-mastercss_preview_fixes-purpose"),
    "example": {
      "mode": "lint-fixes",
      "patterns": [
        "src/button.html"
      ],
      "rules": "sort-classes"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_preview_fixes-lifecycle")
  },
  "mastercss_preview_directive_format": {
    "purpose": text("tools/mcp", "editorial-mastercss_preview_directive_format-purpose"),
    "example": {
      "content": "@safelist \"(background-color:transparent) !\";",
      "filePath": "card.css"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_preview_directive_format-lifecycle")
  },
  "mastercss_apply_preview": {
    "purpose": text("tools/mcp", "editorial-mastercss_apply_preview-purpose"),
    "example": {
      "confirmToken": "<token-from-reviewed-preview>"
    },
    "lifecycle": text("tools/mcp", "editorial-mastercss_apply_preview-lifecycle")
  }
}

/** Built-in MCP prompts (`prompts/list`); the fixtures compare names with the server. */
export const mcpPrompts: { name: string, use: string }[] = [
  { name: 'debug-missing-css', use: text("tools/mcp", "prompts-0-use") },
  { name: 'review-mastercss-classes', use: text("tools/mcp", "prompts-1-use") },
  { name: 'migrate-to-mastercss', use: text("tools/mcp", "prompts-2-use") }
]

/** The result contract shared by every tool; complete schemas come from `tools/list`. */
export const mcpResultContract: string[] = [
  text("tools/mcp", "results-0"),
  text("tools/mcp", "results-1"),
  text("tools/mcp", "results-2"),
  text("tools/mcp", "results-3"),
  text("tools/mcp", "results-4"),
  text("tools/mcp", "results-5")
]
