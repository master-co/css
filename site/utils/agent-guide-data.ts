import type { DocumentCodeExampleProps } from '@master/internal-site/components/document-types.ts'
import type { DocumentPromptProps } from '@master/internal-site/components/document-types.ts'
import type { DocumentFlowProps } from '@master/internal-site/components/document-types.ts'

export const agentPrompts = {
  "install": {
    "title": "Set up Master CSS",
    "text": "You are working in an existing web application. Set up Master CSS end to end.\n\nDocumentation: https://css.master.co/guide/installation\n\nFirst inspect the project before editing: package manager, Node.js version, framework and build tool, the existing CSS entry and where it is imported, the current styling system, ESLint setup, dev/build/test commands, and agent guidance files such as AGENTS.md.\n\nBefore editing, ask me these and wait for the answers. Do not choose them yourself:\n- Rendering mode: static (the default; build-time CSS from complete class names), prerender, runtime, or progressive. See https://css.master.co/guide/rendering-modes.\n- Setup scope: the full setup (ESLint config, MCP package, AGENTS.md guidance) or --minimal (framework integration only).\n- Existing styling: if the project uses Tailwind CSS or another styling system, whether to migrate it to Master CSS (the default) or keep it in place. See https://css.master.co/guide/migration.\n\nThen adopt Master CSS conservatively:\n1. Use Node.js 24 or later and run every command from the app root, where its package.json lives.\n2. Preview the plan: npm create @master/css@latest -- --yes --dry-run (add --framework <name> if detection is wrong, and --minimal if I chose it). Show me the plan.\n3. Run the same command without --dry-run. It installs every Master CSS package at the installer's version; keep them on that one version.\n4. Finish any framework-specific steps the installer prints. Confirm the app imports the CSS entry that contains @import '@master/css'; installing the packages alone does not load it.\n5. If I chose to migrate, convert the existing styling to Master CSS by following the matching guide under https://css.master.co/guide/migration (Tailwind CSS: https://css.master.co/guide/migration/tailwindcss), keep the rendered result unchanged, and remove the old styling dependencies only after nothing uses them. If I chose to keep it, leave the existing styling system in place.\n6. Register the MCP server with this agent's native registration path and an absolute root, using the project's installed package: npx @master/css-mcp --root <absolute app path>. If the project has no @master/css-mcp, install it as a dev dependency at the same version as @master/css first. Then install the skill: npx skills add master-co/css --skill master-css.\n7. Add the project's actual validation commands below the generated ## Master CSS block in AGENTS.md.\n8. Preserve the existing architecture and avoid unrelated refactors.\n9. Verify: start the dev server and render <p class=\"w-fit mx-auto my(0) p-md r-md b(1) b-solid b-line-divider bg-surface-raised text-sm fg-text-strong\">Hello World</p> (className in JSX). Confirm 1rem of padding, change p-md to p-lg and confirm 1.5rem. Then run the project's lint, build and tests. With MCP, call mastercss_workspace_info and mastercss_setup_audit and confirm the root and stylesheet entries belong to this app.\n\nWhen finished, summarize the changed files, the rendering mode and options chosen, behavior intentionally left unchanged, the validation results, and anything not verified in a browser."
  },
  "context": {
    "title": "A focused styling task",
    "text": "Style the target component with Master CSS.\n\nDocumentation: https://css.master.co\n\nFirst inspect the CSS entry, theme tokens, component classes, nearby UI, and project checks.\n\nUse existing vocabulary. Keep complete, statically readable class strings. Verify unfamiliar syntax against the documentation or generated CSS.\n\nPreserve semantic HTML, accessible names, keyboard behavior, and existing functionality. Explain any new shared token or component class.\n\nImplement one reviewable change. Run the relevant checks and inspect the result at narrow and wide widths in both themes. Report changed files and any unverified behavior."
  },
  "rules": {
    "title": "AGENTS.md — Master CSS rules",
    "text": "When editing Master CSS:\n- Read https://css.master.co and the project's existing styling conventions.\n- Inspect the CSS entry, rendering mode, theme tokens, component classes, utilities, and custom variants.\n- Reuse existing vocabulary and keep class strings complete and statically readable.\n- Verify unfamiliar syntax with MCP or the CLI; do not assume another framework's syntax is supported.\n- Preserve semantic HTML, accessible names, keyboard behavior, and functionality.\n- Use ESLint for team class policy and the Language Service for completion, hover, and directive formatting.\n- Run the project's relevant checks and inspect the changed UI before reporting completion.\n\nAdd this project's actual validation commands below."
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
    "text": "Set up the Master CSS MCP server for this project.\n\nProject root: /absolute/path/to/project\nCommand: npx -y @master/css-mcp@VERSION --root /absolute/path/to/project\n\nIdentify the MCP client and use its native registration path. Do not assume every client reads mcp.json. Keep machine-specific absolute paths out of team configuration unless requested.\n\nVerify the registration, reconnect the client if needed, then call mastercss_workspace_info. Confirm the returned root and manifest entries match this project."
  },
  "inspect": {
    "title": "Inspect before editing",
    "text": "Use the Master CSS MCP server to inspect this workspace.\n\nCall mastercss_workspace_info and mastercss_setup_audit. Confirm the root and entry stylesheets before inspecting classes or linting the affected files.\n\nIf fixes are needed, create a scoped preview and explain the diff before applying it. Verify the changed UI after applying a reviewed preview."
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
/** Resolve only the authored MCP placeholder and the two first-party documentation origins. */
export function resolveAgentPrompt(prompt: DocumentPromptProps, { version, docsURL }: { version: string, docsURL: string }): DocumentPromptProps {
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) throw new Error('Agent prompts require an exact public version')
  const docs = new URL(docsURL)
  if (!['http:', 'https:'].includes(docs.protocol)) throw new Error('Agent documentation requires an HTTP origin')
  return {
    ...prompt,
    text: prompt.text.replace(/(@master\/css-mcp@)VERSION(?![\w.-])/g, (_, prefix) => prefix + version)
      .replace(/https:\/\/(?:rc\.)?css\.master\.co(?=$|[\s/])/g, () => docs.origin)
  }
}

export function agentPromptMarkdown(name: string, prompt = agentPrompt(name)) {
  return `${prompt.title}\n\n\`\`\`text\n${prompt.text}\n\`\`\``
}
export function previewWorkflowMarkdown(workflow = previewWorkflow) {
  return [workflow.title, ...workflow.steps.map((step, index) => `${index + 1}. **${step.title}** — ${step.description}`), workflow.caption].join('\n\n')
}

export const agentFixExample = {
  title: 'One-file sort preview',
  language: 'html',
  sourceLabel: 'src/button.html — before',
  resultLabel: 'Proposed content',
  source: "<button class=\"bg-blue-60 p-md flex gap-sm\">Save</button>",
  result: "<button class=\"flex gap-sm p-md bg-blue-60\">Save</button>"
} satisfies DocumentCodeExampleProps
