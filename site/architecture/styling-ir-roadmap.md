# Styling IR and public integration roadmap

Status: proposal for 2.x; the existing execution contract remains Manifest v1
with languageVersion 3. Tracked by
[#455](https://github.com/master-co/css/issues/455) and
[#456](https://github.com/master-co/css/issues/456).

## Stable execution boundary

The compiler translates CSS authoring into executable definitions and native CSS.
The engine executes the manifest; it does not reconstruct the original source.
The schema owns dependency-light serializable types and codec helpers. Tooling
owns semantic analysis, while compiler project APIs provide filesystem context.

External tools should use these public surfaces:

| Need | Existing surface |
| --- | --- |
| Load project definitions | `loadProjectManifest` from `@master/css-compiler/project` |
| Enumerate design tokens | `flattenMasterCSSManifestVariables` from `@master/css-schema/manifest` |
| Store execution data | `serializeMasterCSSManifest` from `@master/css-schema/manifest` |
| Inspect a class | Engine `inspect` through `@master/css` or `@master/css/node` |
| Validate classes | `validateClassNames` from `@master/css-tooling/validator` |
| Obtain canonical recommendations | `createToolingSession` from `@master/css-tooling` |
| Explain a project | `createMasterCSSInspectionReport` from `@master/css-compiler/diagnostics` |
| Query from an AI client | Existing MCP query/inspection tools with project context |

A runnable example of the load → enumerate → serialize → inspect → validate
workflow is `packages/compiler/examples/inspect-project.ts`. From a project
directory, run it with an explicit CSS entry and complete class names:

```sh
node /path/to/css/packages/compiler/examples/inspect-project.ts app.css color:red padding:red
```

It prints `status: "ready"` with token names, per-class engine inspection and
value validation, or `status: "error"` with a code and message. An empty class
list returns `ready` with `classes: []`; it does not look like a failed load. The
example never selects a preset after a project error. Run its regression with:

```sh
pnpm --filter @master/css-compiler test tests/public-inspection-workflow.test.ts
```

The example creates a temporary CSS project, uses only public exports, preserves
the loaded manifest across consumers, and disposes engine/tooling sessions.
It distinguishes known-invalid CSS values, unknown dynamic values and unmatched
classes. No filesystem writes to the inspected project are required by the APIs.

An AI client must not silently replace a failed project load with the default
preset. A class that is unmatched or ambiguous in the project cannot be explained
using a different manifest. Browser support is not checked merely because a
semantic engine can emit a declaration.

## Separate authoring and execution models

| Data | Owner | Stability policy |
| --- | --- | --- |
| Executable variables, utilities, modes and variants | schema / engine | Existing versioned execution contract |
| Source files, import graph and locations | compiler / project | Existing documented inspection APIs |
| Comments, formatting, edit identity and selection | future authoring model | Proposed separately; not part of runtime Manifest |
| Matcher indexes, caches, binding handles | engine / platform internals | Private implementation details |

A visual editor needs to know which authored definition an edit changes, how a
replacement affects imported definitions, and whether a source changed since the
preview. An execution manifest alone cannot answer those questions safely.
Do not solve that gap by serializing compiler caches into a browser payload.

## Proposed follow-up capabilities

These are specification deliverables for the existing roadmap issues, not new
APIs already promised by 2.0:

1. **Portable read-only inspection:** document which existing report fields are
   sufficient for a third-party token browser and explain panel. A concrete gap
   must identify its semantic owner and consumers before adding an export.
   Acceptance: the example works without private imports and reports missing
   project context explicitly.
2. **Version compatibility corpus:** retain representative supported manifests
   and rejection cases. Test compiler → codec → engine and server → hydration
   boundaries. Acceptance: unsupported language versions fail before execution;
   supported roundtrips preserve declarations, order and resource dependencies.
3. **Source-aware edit proposal:** define preview inputs, source identity,
   diagnostics and stale-source rejection before exposing mutation APIs.
   Acceptance: edits cannot silently apply to changed source or unrelated files;
   duplicate declarations and native conditional boundaries survive accepted edits.
4. **Semantic comparison proposal:** compare supported execution data by generated
   behavior, including value source and cascade identity, rather than JSON text.
   Acceptance: an apparent spelling simplification that changes a competing rule's
   winner is reported as a behavior change, not a safe rewrite.

Follow-up implementation and research issues are
[#457](https://github.com/master-co/css/issues/457) for effective definition
provenance, [#458](https://github.com/master-co/css/issues/458) for source-aware
edit previews, [#459](https://github.com/master-co/css/issues/459) for bounded
semantic comparison, and [#460](https://github.com/master-co/css/issues/460)
for separate lossless CSS roundtrip research.

### Public capability and gap map

| Third-party task | Existing path | Missing capability, if any | Owner and compatibility |
| --- | --- | --- | --- |
| Browse tokens and explain a known class | Project loader, schema token helper, engine inspection, tooling validator; the executable example above | No new API is required for a read-only result. Project failure must be reported. | Keep compiler/tooling data outside the runtime bundle. |
| Explain which authored definition won after imports and replacement | Compiler project reports expose source files; Rust lowering also tracks replaced utility sources internally | A complete public, source-located definition provenance view is not yet established for all effective definitions. Do not import the binding's raw parse IR as an SPI. | Add a read-only compiler report only after fixture-backed gaps are specified. It must preserve Manifest v1 execution bytes. |
| Preview an editor change to an imported utility | Compiler can compile a whole project, but it does not expose a source-aware edit proposal or stale-source precondition | Preview and patch ownership, exact authored range, and revision checks need a separate authoring contract. | Compiler/project orchestrates sources; Rust owns parsing and lowering. Add an authoring API separately from the runtime manifest. |
| Compare two projects' styling behavior | Engine can inspect a finite class set and tooling can validate values, but callers cannot claim general CSS equivalence from JSON equality | A finite-scope semantic diff needs a specified class/context corpus, rule order, resources, and an explicit `unknown` result for unsupported contexts. | Semantic comparison belongs to Rust with a compiler/tooling wrapper. No TypeScript semantic fallback. |

The read-only example is the first extension test case. It returns a successful
empty class list, known-invalid CSS values, and a failed project as distinct
results. The other rows are design gaps, not hidden capabilities inferred from
the existence of a private parser.

### Source-aware edit preview: decision boundary

Consider an imported stylesheet with this definition:

```css
@utilities {
  badge {
    color: oklch(60% 0.1 20);
    color: red;
    font-size: 0.875rem;
  }
}
```

An editor may propose changing only the second color declaration. Its preview
must identify the owning file and its original content revision, show an exact
source patch, recompile the affected graph, and return diagnostics plus a
before/after behavior report for the stated class set. It must retain the first
fallback declaration and the `font-size` declaration at their authored positions.
Writing is a separate, explicitly invoked host action; preview itself changes no
file. If the owner file changed, disappeared, or ceased to match the requested
target, reject the proposal rather than applying it elsewhere or silently
recompiling against stale input. Imported package or remote sources are read-only
until a host explicitly supplies a writable owner.

This requires an authoring model that can represent source location, comment and
format preservation, and edit intent. Its identity/revision policy is scoped to
the source files involved; Manifest v1 does not gain CSS text, comments, editor
selections or universal stable node IDs. A follow-up specification must choose
the exact input/output schema and failure codes after proving them against the
compiler's existing source maps and definition replacement behavior.

### Lossless CSS roundtripping: separate research

A source formatter or code editor may require `parse → print` to preserve
comments, whitespace, quoting, native at-rule tokens, and unsupported CSS
verbatim. That is a different promise from a visual editor's targeted edit
preview. A proposed roundtrip contract must define its supported grammar,
unchanged-source byte guarantee, error recovery and behavior on unknown syntax
before implementation. Test it against imported stylesheets with comments,
duplicate declarations, native functions and mixed Master/native rules. A
successful execution-manifest reload is not evidence of source roundtripping.

The authoring snapshot, if one is ever standardized, needs its own version and
storage policy. It should not become a required input for compilation or a
runtime download. The research may conclude that retaining source text plus
surgical patches is safer than a general-purpose lossless tree; that decision
must come from fixtures and measured editing needs.

### Semantic comparison: bounded claim

For `display:block flex` versus `block flex`, a comparison over that specific
class list must report the changed winner. Identical declaration sets or a
shorter spelling are insufficient evidence. The comparison input must name the
manifest pair, class lists and relevant layer/importance/condition context. Its
output must distinguish observed equivalence in that finite corpus, observed
difference, and unknown behavior outside it. Browser support and computed values
remain unverified unless an actual browser run is included in the evidence.

The engine owns rule identity, sorting, resources and condition semantics; a
tooling wrapper may present the results to editors. This comparison is read-only
and cannot authorize an autofix or migration by itself. Test cases must include
raw versus token values, explicit importance, native layers, shorthand/longhand
competition, condition changes, fallback declarations, and resource withdrawal.

### Persistence and migration boundaries

A third party may store a supported execution Manifest with the schema codec and
reload it with the same language version. That data is executable, not editable.
Unknown top-level JSON retained by the envelope is opaque metadata; nested typed
definitions may reject unknown fields. A future authoring format, if accepted,
needs its own version and migration tests that preserve author intent in supported
constructs. Unsupported versions must fail before execution or editing. No
automatic upgrade is promised for comments, source positions or constructs a
future parser cannot preserve.

Runtime payload should continue carrying execution data only. An optional
authoring snapshot or diff is delivered to the editor/tooling host, with separate
size and latency measurements before public release. The 2.x work should prove
that adding inspection or editing APIs does not increase the static or runtime
entrypoint bundles when the capability is unused.

The authoring/editing work needs its own decision-complete design before
implementation. In particular, do not guess a new wire format, universal stable
node IDs, upgrade algorithm or lossless parser requirement from this roadmap.

## Compatibility and failure boundaries

- Package version, Manifest version, language version and binding ABI are
  different contracts. Updating a field by hand is not a migration.
- Preserving unknown JSON does not mean new semantics can be ignored safely.
  Nested typed contracts can reject unknown fields.
- Compiling to CSS is not verification of browser support or computed values.
- A changed declaration order, layer, condition or resource lifetime is an
  observable change even if a textual diff looks small.
- Third-party tooling remains outside the runtime bundle. It must not import
  `@master/css-internal` or depend on a runtime event bus.

## Rollout

The 2.0 freeze report must pass before any proposal is promoted to a supported
2.x extension contract. Keep the existing read-only workflow usable throughout.
Additive capabilities receive focused consumer tests and documented errors;
incompatible execution semantics require an explicit version decision and
migration plan. This RFC does not authorize publication or release configuration
changes and makes no promise of CSS source roundtripping in Manifest v1.
