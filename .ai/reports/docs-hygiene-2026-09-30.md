# Public documentation hygiene — 2026-09-30

## Policy and scope

Current Guide, Reference, Blog, official examples and public package READMEs teach
current Master CSS. Syntax/API history, old/new comparisons and upgrade steps live
only under `site/app/[locale]/guide/migration/`. Navigation and search retain those
guides. General prose does not link to them. MCP catalogs may name the external
styling-system conversion prompt and state its purpose.

Internal architecture, historical reports and semantic migration fixtures retain
their evidence. Current compiler migration API declarations remain a complete
public export catalog; upgrade instructions belong in Migration Guide. The current
Rust-backed session method `lowerCSSDirectives` remains documented: the unavailable
former standalone TypeScript export is a different interface.

## Disposition inventory

The [page/source inventory](docs-hygiene-inventory-2026-09-30.csv) records all 188
registered public pages, 13 affected shared MDX sources, 35 package/example/site
READMEs, the retired CLI route, the unpublished draft and the internal evidence
exception. Each row records retain/rewrite/relocate/delete/retire decisions and the
affected paragraphs, tables, examples or destination owner. Reference currently
contains 89 documents; English and Traditional Chinese exports share their source.

| Sources | Disposition | Public owner/result |
| --- | --- | --- |
| Directive contract and its generated Reference sections | Rewrite current scopes, tokens, native resources, mixins and layers directly; remove retired directive headings and upgrade profiles | Current Directives Reference; historical entry/wrapper explanations in v2 RC guide |
| Variables & modes contracts and Guide lookup list | Remove old settings chapter and retired modifier narrative; retain native cascade, activation, unconditional delivery and useful entrances | Variables & modes Reference and Guide |
| Declaration components, selectors, conditions, spacing and compatibility | Remove length-multiplier, shortcut and alias history; retain native units, resolution `x`, explicit `var()`, native selectors and canonical families | Current syntax contracts and Guide |
| Colors | Move the complete previous-name/replacement table; preserve current contrast guidance | v2 RC native adaptive colors section; Colors owns current contrast limits |
| Theme and cascade layers | Remove removed-modifier, breakpoint-token and compose upgrade narrative | Current native declarations, custom media and layer behavior |
| AI coding, linting and rendering | Remove upgrade instructions and links; express current authoring and lint boundaries; correct adjacent obsolete ABI/data-version claims | Current workflow Guides |
| MCP server prompt | Retain external CSS, CSS Modules, Sass, Tailwind, CSS-in-JS and component-library sources; exclude Master CSS version upgrades | Same `migrate-to-mastercss` prompt name; no tool/schema changes |
| MCP Guide/README, shared options and prompt data | Keep only prompt name and external-system purpose; remove shared historical upgrade prompt and workflow tutorial | External-system workflow and full prompt example in Migration overview |
| CLI Reference and README | Retire generated `tools/cli/migrate` article; preserve CLI executable; relocate options, report fields and examples | v2 RC command options and executable CLI examples |
| Compiler and ESLint READMEs | Remove former export/package and class-syntax history; retain current interfaces, delivery limitations and canonical fixes | Current README contracts; historical interface ownership in v2 RC guide |
| Design System | Replace conversion table with current class/native-effect teaching; retain comparison component and migration navigation catalog | Current component gallery |
| Published Next Blog | Replace historical integration framing with current behavior and correct hydration version | Current published article |
| Machine exports | Generate only registered public routes; remove retired CLI page from Reference artifacts and indexes | Search, per-page Markdown, llms and sitemap share current public ownership |

The inactive `/blog/v2` draft has no public page. It remains unpublished and is
excluded from llms generation, matching navigation and search.

## Regression coverage

- Editorial checks inspect exported public documents and repository-owned public
  READMEs, excluding installed dependencies and PHP vendor files.
- Retired syntax and upgrade narrative fail outside Migration Guide. Tests retain
  ordinary before/after diffs, DOM removals and native `@page` syntax.
- Reference checks cover the missing migration route, retired syntax identifiers,
  current contracts, relocated color mappings and every published CLI option.
  Generation starts with an injected stale CLI route to verify that regeneration
  removes it even when the previous page registry still contains it.
- CLI workflow tests read their migration examples from the version guide instead
  of retired Reference editorial data.
- MCP tests preserve all external source systems and assert the explicit exclusion
  of Master CSS version upgrades and historical manifest/unit conversion steps.
- Postbuild checks inspect every registered Guide/Reference/Blog article in all
  three static URL forms (unprefixed, English and Traditional Chinese). Navigation
  and the MCP prompt catalog retain their permitted ownership; article prose and
  code follow the same hygiene rules as portable Markdown and search.

## Validation

| Check | Result |
| --- | --- |
| MCP test | 8 files / 50 tests passed, including prompt registration, CSS comparison, preview and apply safety |
| MCP lint, type-check, build | Passed |
| Compiler, CLI and ESLint package lint | Passed |
| Site Reference | 24 passed, including stale route removal, stable anchors and relocated CLI options |
| Site LLMs/search/Markdown | 33 passed, including all current public articles and public READMEs |
| Site documentation examples | 17 passed, including actual CLI preview/write/target examples from Migration Guide |
| Site MDX imports | 2 passed |
| Site syntax | 14 passed |
| v2 RC focused guide checks | 3 passed; updated stale font examples and ABI assertion to verified current contracts |
| Static route/index/article boundary | 5 passed; retired CLI route and unpublished draft absent from relevant indexes |
| Site lint | Passed with 0 errors and 156 existing class-order warnings |
| Initial complete static build | Passed; postbuild verified 94 public asset URLs |
| Final build and full TypeScript check | Blocked by concurrent site icon-interface changes; details below |
| Site CSS delivery snapshot | Mismatch on untouched Vite Blog route; details below |
| AI context and diff whitespace | Passed |

Browser checks used the successfully built static output. Seven moved/current
sections at 390, 768 and 1280px, each in light and dark, produced 42 screenshots.
All had no document-wide horizontal overflow or page errors. Visual spot checks
confirmed readable role replacement tables, CLI options, code blocks and Reference
navigation. Search for `@compose` reached `/guide/migration/v2-rc#compose`; keyboard
navigation, Escape, focus restoration and retained query worked. The retired CLI
route returned 404. A mobile navigation check found no retired route links, and
the migrated CLI code copied its complete command; denied clipboard writes showed
the existing failure message. Reduced motion was enabled during these checks.

### Remaining working-tree validation blockers

The workspace contains independent, ongoing site rendering/icon changes. The
initial complete build and site type-check passed. A final rebuild compiled but
failed TypeScript because installation layout files still pass string brand keys
to `createLayout`, whose shared `create-page.tsx` option was concurrently narrowed
to `React.ReactElement`. For example, Astro's layout passes `icon: 'astro'` at line
17. A fresh `tsc --noEmit --incremental false` reproduced the failures; the ordinary
incremental script's zero exit is not sufficient final validation. This task did
not edit those layouts or the icon interface. Rebuild and rerun the fresh type check
after that separate change is complete.

The CSS delivery snapshot also differs on
`/blog/bootstrapping-master-css-with-vite`, whose authored content was untouched.
At segment 187 the snapshot expects `.doc-values` CSS and the delivered build has
`.monaco-editor` CSS instead. The snapshot was not refreshed: this documentation
cleanup does not authorize a CSS delivery contract change. That mismatch needs
separate investigation with a stable rendering/build working tree. Semantic docs
examples, current syntax tests and MCP CSS comparison checks passed independently.

Master CSS semantics, CLI migration implementation and core generated CSS behavior
were not changed. Public changes are the external-only MCP prompt scope, the
retired Reference route and the editorial ownership of historical material.
