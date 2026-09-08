# Maintaining the Reference

Reference verifies language and tool behavior during writing, explanation and review. Guide pages teach a workflow and link to the formal contract. Avoid separately maintaining the same rule in both places.

## Sources and outputs

| Content | Source | Generated facts |
| --- | --- | --- |
| Existing utilities | `app/[locale]/reference/*/{metadata.ts,syntaxes.ts,content.mdx}` | Public tooling declarations, aliases, examples and full CSS |
| Language rules | `app/[locale]/guide/*/contract.mdx`, routed by `editorial.ts` | Complete `Class2CSS` and configured examples |
| Directives | `app/[locale]/guide/directives/contract.mdx` | Named sections in the directive Reference |
| Tokens | Public preset manifest and tooling builtins | Names, values, modes, conditions and consumers |
| CLI | Public `master-css` binary | Actual `--help` output |
| MCP | Public stdio `tools/list` protocol | Actual tool descriptions and input/output schemas when advertised |
| Package APIs | Published exports and public TypeScript entrypoints | Declarations, overloads and public names; API census controls visibility |

The declarations, selectors, conditions and directives Guide routes redirect through `utils/legacy-syntax.json`: known rule anchors lead to Reference, while other visits lead to a step in the Getting Started Syntax Tutorial. They have no indexed teaching body. Other Guide locations retain their workflow content and old anchor entrances. Rule registry entries separate the `source` contract path from the `guide` learning URL. The `contract.mdx` files remain beside existing MDX includes during migration. They are the single authored source consumed by Reference, not a second copy of the Guide.

`prepare-app` builds `.generated/reference.json`, the searchable documents, `public/reference/index.json`, per-page English and Traditional Chinese Markdown URLs, and section text bundles. `build:llms` reuses the same normalized Reference in `llms.txt` and `llms-full.txt`. Generated outputs are ignored; edit their sources.

The current source revision and semantic/content digests identify the build inputs. Current-version URLs can change between builds; these are not historical version snapshots. A local dirty checkout is not a published immutable document.

Individual document pages render their authored or generated body directly. Do not inject a version/source/Markdown toolbar, a page-level copy-example control, a generic Related reference section or an extra alias list. Keep the body as the reading source of truth; search and machine exports derive from the existing shared content model.

## Editing safely

1. Keep existing utility URLs. Add new contracts through the section registry instead of creating a URL for every alias or token.
2. Preserve explicit heading IDs. In MDX, write `## New title \{#stable-id\}`. The braces must be escaped for MDX; the visible title and exported Markdown omit the marker. Add an old anchor entrance when moving a section.
3. Add prose for prerequisites, exceptions and intended use. Placeholder syntax rows describe declaration shapes, not the full grammar of accepted values.
4. Keep a text equivalent for every meaningful component. `markdown.ts` handles `Overview`, `Class2CSS`, literal `Code`, local MDX includes, token tables and configured examples. Unsupported components are reported and fail the coverage test. Do not execute arbitrary JSX to extract prose.
5. Use `ConfiguredExample` for classes that depend on custom theme settings. It compiles the configuration through the public compiler before generating CSS with the public engine.
6. Add identifiers and task vocabulary in `editorial.ts` only when useful. Search performs retrieval, not syntax interpretation. Project-specific validation belongs in existing CLI, MCP or Play workflows.
7. When changing tool registrations or exports, rebuild their packages before generating docs. CLI/MCP descriptions come from the built public binaries. API declarations resolve public entrypoint source files, with published declarations used for entries without a source counterpart.

The first content language is English. Traditional Chinese navigation remains available and per-page Markdown explicitly identifies English fallback. Preserve semantic IDs and identifiers when adding a translated body; do not silently label English prose as a completed translation.

Guide and Reference overviews share `site/components/DocumentationIndex.tsx` and `site/styles/documentation-index.css`. Reference adapts its catalog in `reference/Index.tsx`; Guide derives its primary teaching entries from existing category metadata through `site/utils/guide-overview.ts`. That Guide model also supplies overview search nodes during `prepare-app` and its body in llms exports. Keep category anchors and metadata-derived links aligned when changing either overview. Section icons are keyed by section ID. The old `#syntax-tutorial` overview anchor belongs to Getting Started. `utils/syntax-tutorial.ts` uses the Reference component adapters to include generated CSS and complete configured examples in tutorial search and llms output.

## Validation

Start from the usual package-warmed workspace (`pnpm build:site` performs the full orchestration). Focused commands:

```sh
pnpm --filter site prepare-app
pnpm --filter site test:reference
pnpm --filter site test:syntax
pnpm --filter site test:llms
pnpm --filter site test:docs-examples
pnpm --filter site lint
pnpm --filter site type-check
pnpm --filter internal test
pnpm run check:ai-context
```

After a full static build, `pnpm --filter site test:syntax-migration` checks the retired routes’ noindex/canonical metadata, no-JavaScript links and sitemap exclusion, including canonical route copies.

`internal` has no package-local lint script. Shared search, heading and table changes also require Guide regression checks. Inspect 390px, 768px and 1280px layouts, keyboard selection, one-press Escape, focus restoration, direct row links and reopening search with its query preserved.

`search-tasks.ts` is the fixed 30-query acceptance set. `reference.test.ts` covers corpus completeness, aliases, source metadata, stable anchors, relationships, pilot rendering/Markdown parity and complete configured examples. The tests fail on missing adapters instead of claiming an incomplete export is complete.

## Outcome evaluation

Automated checks establish content and implementation correctness. They do not establish human task completion times or agent success rates. Use `evaluation.json` for the pending outcome study:

- Recruit at least five new and five experienced users. Record success and time for simple lookup (target median ≤30s), variant selection (≤60s) and cross-concept review (≤3min); target ≥80% correct completion.
- Run the twelve fixed tasks through two actual agent retrieval workflows: HTML/browser retrieval and per-page Markdown/index retrieval. Record model/version, available tools, retrieved documents, answer, generated changes and behavioral check results. Target at least ten passing tasks in each workflow.
- Keep failures, rewritten queries and incorrect assumptions. Evaluate semantic retrieval or deeper Play integration only after the lexical index and authoritative content fail a concrete task.

No chat interface, vector database, new docs MCP, new CMS or runtime semantic implementation is introduced by this work.
