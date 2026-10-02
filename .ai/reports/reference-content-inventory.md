# Guide and Reference content inventory

Current source inventory for the Master CSS documentation. [Site ownership](../../site/AI.md#guide-and-reference-ownership) defines the content policy; [Reference maintenance](../../site/reference/MAINTENANCE.md) defines generation and validation.

## Ownership and evidence

Guide teaches design and implementation tasks. Reference owns complete token catalogs and Master CSS contracts. Syntax Tutorial teaches class syntax through working examples. Complete collections belong in Reference; Guide selects explicit values from the same data for self-contained lessons.

| Facts | Source |
| --- | --- |
| Catalog and public routes | [reference/build.ts](../../site/reference/build.ts) and generated `site/.generated/reference.json` |
| 119 direct-value families and 7 recipes | [mixins.css](../../packages/preset/src/mixins.css) |
| Family capabilities, prefixes and namespaces | Rust analysis exposed through language/tooling `tokenFamilies()` at site preparation time |
| Token values, scopes and dependencies | [theme.css](../../packages/preset/src/theme.css) and the compiled preset manifest |
| Shared Guide and Reference facts | [foundation data](../../site/common/foundation-data/tokens.ts) |
| Public tool and package contracts | [tool contracts](../../site/reference/tool-contracts.ts), [package contracts](../../site/reference/package-contracts.ts) and API census |

The generated catalog contains 84 content documents. Counts exclude category indexes, locale copies, Markdown/text copies and navigation-only URLs. Capability coverage determines the catalog; these counts are not a quota.

| Group | Documents |
| --- | ---: |
| Syntax and execution rules | 6 |
| Token families, values and presets | 20 |
| Preset recipes | 7 |
| Stylesheet directives | 8 |
| CLI commands | 3 |
| MCP tools | 20 |
| Package APIs | 20 |

## Reference contracts

All paths below are relative to `/reference/`.

| Rule path | Contract |
| --- | --- |
| `rules/declarations` | Direct declarations, encoding, functions, units and importance |
| `rules/selectors` | Class/selector composition, target identity and descendant encoding |
| `rules/conditions` | Media, container and named conditions |
| `rules/modes` | Variables, namespaces, modes and resolution |
| `rules/layers` | Layer ownership and ordering |
| `rules/extraction` | Sources, complete classes and candidate boundaries |

Token documents live under `tokens/`:

| Group | Slugs |
| --- | --- |
| Family lookup | `families` |
| Colors | `color`, `color-line`, `color-surface`, `color-text` |
| Space and appearance | `spacing`, `container`, `radius`, `shadow` |
| Typography | `font-family`, `font-size`, `font-weight`, `leading`, `tracking`, `text` |
| Motion | `animate`, `duration`, `easing` |
| Ordering | `order` |
| Named media conditions | `breakpoints` |

The family index includes all loaded families, including namespaces with no token values. Prefixes, native properties and namespaces come from Rust analysis. Color role names are part of token keys within the color namespace. `text` documents primary tokens and typography companions. `animate` documents complete shorthand values and resource behavior. `container` documents dimensions; explicit container-query thresholds have independent native values.

| Recipe path | Mixin |
| --- | --- |
| `screen-readers` | `sr-only` |
| `grid-columns` | `grid-cols(n)` |
| `grid-rows` | `grid-rows(n)` |
| `grid-column` | `grid-col-span(n)` |
| `grid-row` | `grid-row-span(n)` |
| `clamp-lines` | `clamp-lines(n)` |
| `text-size` | `text("key")` and named `text-*` classes |

Recipe documents include purpose, executable examples, parameter contracts, preset source and complete generated CSS. Each scene uses the public compiler/engine output.

Directive documents live under `directives/`: `entry`, `reference`, `theme`, `definitions`, `source`, `candidates`, `variant`, and `preserve`. Their formal source is the Guide directive contract. Tool and package documents derive signatures and schemas from their owning public surfaces.

## Design Foundations

| Guide | Teaching task |
| --- | --- |
| `spacing` | Component density, grouping and page rhythm |
| `sizing` | Fluid/fixed dimensions, constraints and width caps |
| `breakpoints` | Choosing viewport thresholds for content |
| `containers` | Responsive components and named query containers |
| `corner-radius` | Shape language, nested surfaces, pills and circles |
| `colors` | Palettes, roles, themes and readable combinations |
| `elevation` | Surface relationships, shadows and state hierarchy |
| `typography` | Type hierarchy, treatments and independent settings |
| `motion` | Feedback, entrances and reduced motion |
| `layout-system` | Gutters, columns, regions and responsive composition |

`/guide/responsive-design` connects viewport and container strategies. Guide HTML, search and portable Markdown use identical selected keys. Design advice is distinct from executable token semantics.

## Maintenance and validation

Update authored sources and shared facts, then run `prepare-app` to generate routes, search and per-page Markdown. Never edit generated catalogs directly. Keep consumer tables tied to the effective manifest and native declarations explicit. Project themes and mixins provide project-specific tokens and families.

Check that every family and recipe appears in Reference, examples reproduce complete CSS, all internal links resolve, and portable output uses the same facts as the visible page. Validate Reference, documentation examples, site lint/type-check, CSS contracts and AI context. Browser checks cover changes to layout, interactive specimens, responsive behavior and animation.
