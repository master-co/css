import type { DocumentCodeExampleProps } from '../components/DocumentCodeExample'
import type { DocumentPromptProps } from '../components/DocumentPrompt'
import type { DocumentFlowProps } from '../components/DocumentFlow'

export const agentPrompts = {
  "context": {
    "title": "A focused styling task",
    "text": "Style the target component with Master CSS.\n\nDocumentation: https://rc.css.master.co\n\nFirst inspect the CSS entry, theme tokens, component classes, nearby UI, and project checks.\n\nUse existing vocabulary. Keep complete, statically readable class strings. Verify unfamiliar syntax against the documentation or generated CSS.\n\nPreserve semantic HTML, accessible names, keyboard behavior, and existing functionality. Explain any new shared token or component class.\n\nImplement one reviewable change. Run the relevant checks and inspect the result at narrow and wide widths in both themes. Report changed files and any unverified behavior."
  },
  "rules": {
    "title": "AGENTS.md — Master CSS rules",
    "text": "When editing Master CSS:\n- Read https://rc.css.master.co and the project's existing styling conventions.\n- Inspect the CSS entry, rendering mode, theme tokens, component classes, utilities, and custom variants.\n- Reuse existing vocabulary and keep class strings complete and statically readable.\n- Verify unfamiliar syntax with MCP or the CLI; do not assume another framework's syntax is supported.\n- Preserve semantic HTML, accessible names, keyboard behavior, and functionality.\n- Use ESLint for team class policy and the Language Service for completion, hover, and directive formatting.\n- Run the project's relevant checks and inspect the changed UI before reporting completion.\n\nAdd this project's actual validation commands below."
  },
  "readability": {
    "title": "Review class readability",
    "text": "Review this component's Master CSS classes.\n\nLook for invalid syntax, conflicting declarations, repeated values, missed interaction states, and useful shared vocabulary.\n\nRecommend a small change only when it improves readability or behavior. Explain whether each repeated pattern belongs in a token, a component class, or local markup."
  },
  "feature": {
    "title": "Feature styling",
    "text": "Style this feature with Master CSS.\n\nReuse the project's tokens and component classes. Keep one-off layout decisions in markup. Add a shared token only for a repeated value or a named product decision.\n\nPreserve HTML semantics, accessibility, and behavior. Run the available checks and inspect the result in the browser."
  },
  "tokens": {
    "title": "Token extraction",
    "text": "Review repeated colors, spacing, radius, and type treatments in this route.\n\nPropose token names for shared product decisions, component classes for repeated patterns, and local utilities for one-off geometry.\n\nExplain the reuse behind each proposal before changing the shared vocabulary."
  },
  "review": {
    "title": "Class review",
    "text": "Review these Master CSS class strings.\n\nCheck syntax, declaration conflicts, canonical forms, condition order, repeated raw values, and missing states against the active project manifest.\n\nLead with behavior changes and CSS output risks. Propose small fixes with the relevant evidence."
  },
  "visual": {
    "title": "Visual QA",
    "text": "Run the app and inspect the changed UI at narrow and wide widths in both themes.\n\nExercise hover, keyboard focus, disabled, loading, and responsive states where present. Check reduced motion for animated content.\n\nReport overflow, missing CSS, layout shifts, and behavior changes with the affected element and reproduction steps."
  },
  "setup": {
    "title": "Register the local server",
    "text": "Set up the Master CSS MCP server for this project.\n\nProject root: /absolute/path/to/project\nCommand: npx -y @master/css-mcp@rc --root /absolute/path/to/project\n\nIdentify the MCP client and use its native registration path. Do not assume every client reads mcp.json. Keep machine-specific absolute paths out of team configuration unless requested.\n\nVerify the registration, reconnect the client if needed, then call mastercss_workspace_info. Confirm the returned root and manifest entries match this project."
  },
  "inspect": {
    "title": "Inspect before editing",
    "text": "Use the Master CSS MCP server to inspect this workspace.\n\nCall mastercss_workspace_info and mastercss_setup_audit. Confirm the root and entry stylesheets before inspecting classes or linting the affected files.\n\nIf fixes are needed, create a scoped preview and explain the diff before applying it. Verify the changed UI after applying a reviewed preview."
  },
  "migration": {
    "title": "Plan a migration",
    "text": "Use the Master CSS MCP prompt migrate-to-mastercss for this workspace.\n\nInspect the styling inventory, framework, CSS entries, tokens, source discovery, and available checks.\n\nReturn an incremental plan with the rendering mode, first migration batch, CSS output risks, validation commands, and visual checks. Keep this step read-only."
  }
} satisfies Record<string, DocumentPromptProps>

export const previewWorkflow = {
  title: 'From proposal to verified change',
  steps: [
    { title: 'Preview', description: 'Request a scoped diff. The server leaves workspace files unchanged and returns a token when changes exist.' },
    { title: 'Review', description: 'Check the full diff and intended behavior before asking the client to apply it.' },
    { title: 'Apply and verify', description: 'Apply the reviewed token. The server checks expiry, paths, and source hashes; then run project checks and inspect the UI.' }
  ],
  caption: 'A token belongs to one running server session. A restart, expiry, or successful application requires a new preview.'
} satisfies DocumentFlowProps

export function agentPrompt(name: string): DocumentPromptProps {
  if (!Object.hasOwn(agentPrompts, name)) throw new Error(`Unknown agent prompt: ${name}`)
  return agentPrompts[name as keyof typeof agentPrompts]
}
export function agentPromptMarkdown(name: string) {
  const prompt = agentPrompt(name)
  return `${prompt.title}\n\n\`\`\`text\n${prompt.text}\n\`\`\``
}
export function previewWorkflowMarkdown() {
  return [previewWorkflow.title, ...previewWorkflow.steps.map((step, index) => `${index + 1}. **${step.title}** — ${step.description}`), previewWorkflow.caption].join('\n\n')
}

export const agentFixExample = {
  title: 'One-file sort preview',
  language: 'html',
  sourceLabel: 'src/button.html — before',
  resultLabel: 'Proposed content',
  source: '<button class="bg:blue-60 p:md flex gap:sm">Save</button>',
  result: '<button class="flex gap:sm p:md bg:blue-60">Save</button>'
} satisfies DocumentCodeExampleProps
