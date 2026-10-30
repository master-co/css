# Reference: authoritative lookup contracts

Read [Reference maintenance](../../../../site/reference/MAINTENANCE.md) and [Page admission and retirement](../../../../site/AI.md#page-admission-and-retirement). Complete coverage follows actual public capabilities. Link native CSS concepts to authoritative sources rather than adding a page for every property.

## Find the editable source

| Subject | Starting point and evidence |
| --- | --- |
| Declarations, selectors, conditions, modes, layers, extraction | The `source` in [editorial.ts](../../../../site/reference/editorial.ts) locates the authored `contract.mdx`; verify against the owning Rust code, public API, and tests |
| Directives | The [directive contract](../../../../site/content/guide/directives/contract.mdx), rendered into Reference |
| Tokens, families, namespaces | Public preset manifest and `tokenFamilies()`, adapted by [token-contracts.ts](../../../../site/reference/token-contracts.ts) |
| Recipes | [recipes.ts](../../../../site/reference/recipes.ts), preset definitions, and actual generated CSS |
| CLI and MCP | Public `--help` or `tools/list` with corresponding editorial; rebuild the public package after changing registrations |
| Package APIs | Public exports, declaration entrypoints, API census, and corresponding editorial |

Confirm the current pipeline in the maintenance guide. This table locates owners; it does not define semantics. Do not fix prose by editing `.generated/`, generated public JSON, Markdown, or llms outputs.

Decide whether the request calls for a condition in an existing contract, a data row in an index, or an independently useful Master-specific contract. Add content closest to its actual owner rather than creating URLs for SEO or page counts.

## Write the contract

State the capability and accepted forms, then cover applicable inputs, outputs, defaults, scope, dependencies, override rules, and errors. Include only fields the contract actually has; do not invent defaults or guarantees.

- Names, types, required or optional status, and accepted values have distinct meanings. An example value cannot replace a complete definition.
- Distinguish accepted syntax, emitted CSS, and browser effects. Successful compilation does not guarantee browser support or a suitable DOM structure.
- Identify syntax shapes as shapes rather than a complete grammar. Keep exceptions and errors in the authoritative contract.
- Describe verified behavior neutrally. Claims using `must`, `only`, or `always` need implementation or test evidence.
- Use minimal examples to clarify rules. Link longer instruction and design choices to Guide. Visual lookup may still need complete palettes, scales, and comparisons.
- Keep consistent table fields and stable names. Put long CSS and connected explanations in code blocks or prose instead of crowded table cells.

## Project case: query conditions and container tokens

A request to explain whether a token changes a container threshold belongs to the conditions contract. Follow `editorial.ts` to `guide/conditional-queries/contract.mdx` and inspect `containersize`. Container values and consumers remain with the token Reference.

A useful contract statement:

> Container size tokens do not supply query thresholds. Changing `--container-md` updates its sizing consumers; `(width>=28rem)` remains a literal condition.

This separates the two scopes. Generate CSS through public capabilities to check the preserved query, and use source or tests to establish the token consumers. Do not treat this writing example alone as proof of current behavior.

## Editing example: clarify the boundary

Weak statement:

> Container queries support flexible values and work with your theme.

Revision:

> Put the complete query inside `@container(...)`, including the container name when needed. The browser evaluates the condition against an eligible ancestor container. An explicit threshold such as `28rem` is independent of container size tokens.

This identifies the rule, evaluator, and restriction. A named-container example can clarify the form without inserting a full responsive-design tutorial.

## Maintenance and consistency

Preserve continuing URLs and explicit anchors. When renaming a heading, retain an escaped MDX marker such as `\{#containersize\}`. Follow the maintenance guide for moved sections, old entrances, and internal links. Retirement follows the task and existing policy; do not add redirects or compatibility layers on your own.

Generated CSS must match visible classes and settings. Keep complete configuration with `ConfiguredExample`. Tables and visuals use the same fact owner. Verify that HTML, search, Markdown, and llms retain important conditions, examples, and complete lookup data.

## Common failures

- Editing a generated result that the next `prepare-app` overwrites.
- Inferring complete grammar, errors, or accepted values from an example.
- Treating a Guide's suggested value as a required default.
- Maintaining manual lists instead of using the preset, public types, or tool schema.
- Inferring CSS support from the existence of a documentation route.

Run `prepare-app`, `test:reference`, and site lint, then choose relevant [example, export, and UI checks](review-and-validation.md).
