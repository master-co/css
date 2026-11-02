# Guide and Reference content inventory

Audited on 2026-11-02 against the current checkout. [Site ownership](../../site/AI.md#guide-and-reference-ownership) defines policy; [Reference maintenance](../../site/reference/MAINTENANCE.md) owns generation. Counts describe current capabilities, not a page quota.

## Content ownership

Guide teaches choices and implementation tasks. Syntax Tutorial introduces class composition. Reference owns complete names, values, declarations, restrictions and tool effects. Complete collections are read from the preset or public interfaces; Guide selects the values needed by its examples.

| Question | Reference owner | Guide role |
| --- | --- | --- |
| How is a class parsed and ordered? | Declarations, Selectors, Conditions, Cascade layers | Syntax Tutorial and composition examples |
| Which tokens register classes, and where do values resolve? | Token families, Variables and modes | Theme setup and component scoping |
| Which media and container names exist? | Named conditions | Responsive design chooses boundaries |
| How are named queries defined? | Query definitions | Responsive design uses a concrete definition |
| What values and properties does a preset expose? | Twelve token/family sheets | Layout, colors, typography and motion choose a subset |
| What does a utility emit? | Grid tracks, Truncation, Screen reader text, Direct values | Working interface composition |
| What does a stylesheet directive accept or retain? | Six directive contracts | Reusing styles, route delivery, scanning and pruning |
| What files or source strings are scanned? | Extraction and Scanning directives | Troubleshooting missing CSS |
| Which tool or import path should I call? | MCP tools, CLI commands, Packages | Installation, AI coding and rendering workflows |

## Current catalog

The generated catalog contains **32 articles**. Category indexes, locale copies, Markdown/text copies and navigation-only URLs are excluded. Every article has an authored explanatory figure with light/dark variants, editable source and a portable text equivalent. Integration Guides remain exempt from the article-image requirement.

All article paths below are relative to `/reference/`.

| Group | Count | Paths |
| --- | ---: | --- |
| Syntax | 7 | `rules/declarations`, `rules/selectors`, `rules/conditions`, `rules/modes`, `rules/layers`, `rules/extraction`, `rules/named-conditions` |
| Tokens | 12 | `tokens/families`, `tokens/color`, `tokens/color-roles`, `tokens/spacing`, `tokens/container`, `tokens/radius`, `tokens/shadow`, `tokens/font`, `tokens/text`, `tokens/leading`, `tokens/tracking`, `tokens/motion` |
| Utilities | 4 | `grid-tracks`, `truncation`, `sr-only`, `direct-values` |
| Directives | 6 | `directives/imports`, `directives/theme`, `directives/queries`, `directives/definitions`, `directives/scanning`, `directives/pruning` |
| Tools and packages | 3 | `tools/mcp`, `tools/cli`, `packages` |

The public `/reference` index, sidebar, search and `/reference.md` use the same catalog. The index supports category and alphabetical views. English and Traditional Chinese routes share explicit English body fallback. Headings and navigation use “and” rather than ampersands; syntax retains native `&` where required.

## Consolidation decisions

| Earlier split | Current owner and reason |
| --- | --- |
| Separate grid columns, rows and span pages | Grid tracks compares parent track creation with child spans and retains all four functions. |
| Line clamp alone | Truncation compares one-line and multiline clipping and explains access to the complete text. |
| Separate font family, size and weight pages | Font presents the three independent namespaces behind one prefix and keeps the full scales. |
| Separate animation, duration and easing pages | Motion keeps every animation, duration and easing specimen, including justified playback controls. |
| Separate line, surface and text color pages | Color roles groups semantic aliases while Color palette owns raw hues and steps. |
| Breakpoints treated as token values | Named conditions separates viewport media and container registries from dimensional tokens. |
| Theme also held queries, keyframes and wrappers | Query definitions owns named query expansion; Native CSS pruning owns keyframe policy; Utilities and mixins owns wrappers. |
| Compiler-host APIs inside Imports | Packages owns source preservation and shared resource context; Imports owns stylesheet authoring and delivery boundaries. |
| Repeated property pages and fixed-value lists | Declarations, Token families and Direct values provide complete generated lookup instead of duplicated mini-articles. |

Removed routes have no redirects. Incoming authored links, search entries and exports point directly to current owners. Reference title conjunctions, including Declarations and values and Variables and modes, follow the shared writing policy.

## Evidence and maintenance

- [`reference/build.ts`](../../site/reference/build.ts) builds contracts and publishes current routes, search, Markdown and machine-readable indexes.
- [`utilities.css`](../../packages/preset/src/utilities.css), the compiled preset and public `tokenFamilies()` metadata supply definitions and mappings. Counts are validated against source instead of being repeated in prose.
- [`sheet-editorial.ts`](../../site/reference/sheet-editorial.ts) owns lookup explanations, constraints and working examples. Full typography, surface and motion specimens use the same values as their tables.
- [`contract.mdx`](../../site/content/guide/directives/contract.mdx) remains the formal directive source. Public sections have one owner; its compiler-delivery fixture appendices support documentation tests.
- [`tool-contracts.ts`](../../site/reference/tool-contracts.ts) reads tool registrations and CLI help. [`package-contracts.ts`](../../site/reference/package-contracts.ts) reads public package exports and the API census, currently covering 20 public package entries.
- [`VALIDATION.md`](../../site/reference/VALIDATION.md) records current checks and limitations. Technical correctness, visual review and browser integration are separate acceptance gates.
