---
name: master-css
description: Build, edit, review, and debug UI in Master CSS projects, or bring CSS and Tailwind components into Master CSS when requested. Use project tokens, utilities, native CSS, and compiler-backed checks. Do not switch an unrelated project's styling system without a request.
license: MIT
metadata:
  author: master-co
  version: "1.0"
  compatibility: Master CSS Manifest v6 and language v18; project-matched MCP or CLI recommended.
---

# Master CSS

Use familiar CSS to express the design, then the project's Master CSS vocabulary
to implement it. Generate known utilities directly; use the CSS suggestion tool
when a declaration's class spelling is uncertain. Complex selectors and animations
can remain native CSS.

## Establish the project context

Read the nearby component, CSS entry, installed package versions, rendering mode,
and available validation commands. With MCP, start with `mastercss_workspace_info`;
confirm its root is the intended app. Use `mastercss_setup_audit` if setup is broken.
The active project manifest is authoritative. A load failure requires fixing that
context, not silently using `context: "preset"`.

This skill targets Manifest v6 / language v18. Read the project's matching release
documentation if its versions differ. The current preview documentation is
<https://rc.css.master.co>; use its Reference index and per-page Markdown for focused
lookups. Do not load the complete documentation bundle for an ordinary style edit.

Query only relevant namespaces through `mastercss_manifest_query`. Prefer nearby
product tokens and component patterns. Never infer a token's value from its name.

## Choose the workflow

- **Build or edit UI:** read [authoring](references/authoring.md) when choosing
  class syntax, CSS placement, or the declaration suggestion tool.
- **Import external styles:** read [importing](references/importing.md) for one
  CSS or Tailwind component. Preserve its values and behavior unless redesign is
  requested. This is not a whole-project automatic migration.
- **Review or debug:** read [troubleshooting](references/troubleshooting.md) to
  distinguish extraction, matching, CSS validity, and browser behavior.

Preserve semantic HTML, accessibility, component APIs and interactions while
changing styles. Write complete class strings; use CSS variables for dynamic
values rather than constructing utility names from fragments.

## Verify the result

Use `mastercss_lint_content` for edited buffers and `mastercss_render_css` or
`mastercss_inspect_class` for uncertain output. The server's tools/list determines
available tools; `mastercss_suggest_classes` is optional on older installations.
Report matching, CSS syntax/value validity, and browser support independently.
`unknown` is not `invalid`, and `not-checked` is not verified support.
Clean lint does not prove class recognition or correct browser behavior. For a
repair, use the [evidence review](references/troubleshooting.md#verify-a-repair)
to reconcile final class inspection, conflicts, layers and affected states.

Run the project's relevant lint/build/tests. Check affected viewport sizes and
interactive states in a browser when available. For imports, compare the source
and target with the same reset, fonts, theme and state. Without browser access,
report visual verification as outstanding.

MCP previews apply only their advertised fix or generated-output kinds; they are
not a general source-edit API. Use the agent's ordinary editing workflow for
component changes. With no MCP, use the installed CLI's `suggest` command for
uncertain declarations and JSON lint/inspect commands as described in the workflow
references. Finish with changed behavior, checks performed and
any retained CSS or unresolved issues. Name the actual checked inputs and states;
keep earlier unresolved diagnostics visible when a narrower check passes. Stop
at the user's agreed scope and validation budget, reporting incomplete work.
