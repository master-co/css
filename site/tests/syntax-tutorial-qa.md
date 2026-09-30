# Syntax Tutorial and generated-output acceptance

The article teaches the current contract at `348b35383`: Manifest 4, language 11,
ABI 21. It contains twelve chapters, five focused interactive scenes and one
complete card. Reference retains the exhaustive registries and value catalogs.

## Coverage and evidence

| Article section | Current semantic evidence | Document acceptance |
| --- | --- | --- |
| Read a class | `crates/mastercss-engine/tests/canonical_syntax.rs` | Complete class and escaped selector; preset output |
| Independent declarations | `crates/mastercss-compiler/tests/atomic_authoring.rs` | Full property names, explicit units; atomic authoring check |
| Encode values | `crates/mastercss-engine/tests/canonical_syntax.rs` | Pipes, strings, comma/slash, functions and math spacing |
| Token families | `crates/mastercss-compiler/tests/named_token_contract.rs` | Selected registry mappings, negative margin, fractional alpha, family precedence |
| Selectors | `crates/mastercss-engine/tests/canonical_syntax.rs` | Owner versus target, native combinators and literal boundaries |
| Conditions | `crates/mastercss-compiler/tests/bug_hunt_native_conditionals.rs` | Custom media, native queries, container controls, nesting order |
| Token scopes | `crates/mastercss-compiler/src/theme_tests.rs` | Default root/host scope, native declaration stays in place, nested brand/scheme |
| Mixins | `crates/mastercss-compiler/tests/mixin_contract.rs` | Parameters/defaults, ident, primary/companion tokens, animation longhands |
| Contents | `crates/mastercss-compiler/tests/contents_contract.rs` | Omitted/empty/replaced contents, forwarding, caller scope and recursion boundaries |
| Cascade | `crates/mastercss-compiler/tests/atomic_authoring.rs`, `named_token_contract.rs` | Recipe/token/direct order is independent of HTML order; layers and importance |
| Delivery | `crates/mastercss-engine/tests/scoped_theme_lifecycle.rs`, `crates/mastercss-render/tests/bug_hunt_stylesheet_resources.rs` | Native versus managed delivery, imports/references, dependencies and pruning |
| Complete card | Compiler-validated source shared by the iframe, visible code and Markdown | Narrow/wide card, focus, color scheme and reusable recipe |

`reference/reference.test.ts` recompiles every extracted tutorial example, checks
stable anchors, native token delivery, animation dependencies, condition order,
cascade, source/result pairing and prepared highlights. The search index retains the authored heading IDs before portable Markdown
separates them into anchor elements; its prose and code match the same extraction. `verify-syntax-migration.test.ts` checks
that static HTML retains every displayed HTML/generated-CSS example and that
published generated outputs use closed native disclosures with no nested copies.

## Validation record

Verified on 2026-09-30:

| Check | Result |
| --- | --- |
| `prepare-app` | Passed; search and per-document prepared payloads regenerated |
| `test:docs-examples` | 17 passed; the final added class examples also passed the focused check |
| `test:reference` | 26 passed, including generated metadata and prepared-render regressions |
| `test:syntax` | 14 passed |
| `test:llms` | 33 passed |
| `test:mdx-imports` | 2 passed |
| `test:atomic-classes` | 3 passed |
| Site lint | 0 errors, 156 class-order warnings |
| Site type-check | Passed |
| `check:ai-context` | Passed |
| `build:site` | 478 static pages; all 94 referenced public assets verified |
| `test:syntax-migration` | 6 passed, including static output and searchable anchor checks |

The static audit found 170 Generated CSS disclosures across published Guide,
Reference and Design System pages. Every audited output starts closed, contains
server-rendered code and has no nested disclosure. The tutorial contains 26
compiled class/configuration examples plus two compiled stylesheet examples.

Chromium checks covered 390, 768 and 1280px in light and dark appearances. The
page and all six scenes stayed within their intended scrolling containers. The
initial card viewport is 320px so it fits the 390px layout; Wide uses a real wider
iframe. Narrow/Wide controls changed the card's computed column count, and the
range slider responded to arrow keys.

Verified keyboard summary activation and visible focus, complete clipboard output
and visible clipboard failure feedback, native expansion with JavaScript disabled,
and expansion before hydration remaining open afterwards. Checked live Guide
output, prepared recipe/token output, stylesheet source/result output and selected
Foundation examples. No browser runtime errors were observed.

Interaction checks confirmed hover and keyboard focus feedback, nested dark/light
surfaces retaining the plum brand, animation Play/Pause/Replay, and immediate
visible content under reduced motion. Separate browser cases using compiled CSS
confirmed native token scope, derived-token definition scope, and the need to
deliver generated CSS into a shadow root.

Screenshots, the browser script and measurements are in the local task artifact
folder `/Users/aron/.codex/visualizations/2026/09/29/01a0eb9d-b459-7f73-8392-a10a270ef62d/syntax-tutorial-qa/`.
Browser interaction checks used Chromium; no cross-browser claim is made. Engine
and compiler production code and public APIs are unchanged.
