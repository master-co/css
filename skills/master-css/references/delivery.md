# CSS delivery work

Read this reference for an explicit delivery optimization, performance assessment,
loading-boundary refactor, or a missing-CSS failure that requires tracing delivery.
For an ordinary component edit, keep its styles with their owner and run the local
checks; do not turn it into a whole-site audit.

The public conceptual source is [Optimizing CSS delivery](https://rc.css.master.co/guide/optimizing-css-delivery).
Its Authoring prerequisites are [Route-level styles](https://rc.css.master.co/guide/route-level-styles)
and [Scanning class names](https://rc.css.master.co/guide/scanning-and-pruning).
Native pruning workflow belongs to the delivery guide; directive grammar belongs
to Reference. Use the documentation matching the installed release. Source inspection and a
manifest snapshot describe inputs and definitions; they do not measure production
assets, browser requests, cache reuse or interaction timing.

## Establish the boundary

Identify the app root, installed versions, full CSS entry, local style owners,
rendering mode, native preserve/prune policy and existing validation commands.
Confirm MCP points at that root before inspecting its manifest. If unavailable,
use the project's installed CLI; do not change versions merely to get a tool.

Choose the target route and at least one route that must not load the feature.
Include the relevant later states, external content and navigation path. For a
missing-style repair, start with that file/state and broaden only if the evidence
shows a shared delivery failure. Preserve the selected rendering mode unless the
user's task requires changing it.

## Baseline, edit, verify

1. Keep the current source identity and production output. Trace HTML stylesheet
   links, recursive imports and inline CSS; inspect module side effects and
   conditional components. Record unique asset bytes with the same compression
   settings, files and import depth. Separate runtime/program/hydration resources.
   Use existing project tools; a full-site inventory is conditional on scope.
2. Move feature styles to the route or component that uses them, including all
   interaction states. Keep definitions reusable without importing unrelated
   native rules. Check whether shared barrels or registries still load the feature.
   Preserve layer, selector and declaration ordering. Let the bundler/integration
   handle assembly; do not concatenate arbitrary CSS with relative URLs or imports.
3. Opt native files into pruning only when the possible usage set is known and
   the production build path actually supplies it. A marker alone is not evidence
   of filtering: some local transforms compile definitions without a usage set.
   Prefer complete literal maps for finite class alternatives. Use exact safelists
   for bounded external names; preserve owning native files for open-ended sources.
   Consumer-wide pruning does not automatically opt package CSS in. Review
   variables, native states, conditional rules and managed keyframes together.
4. Rebuild and explain the output difference. Verify the absence of feature rules
   on the unrelated route and their presence on the target, including bare or
   independently rendered contexts when relevant. Test initial and later states,
   keyboard focus, affected themes and widths. In progressive mode, separately
   verify initial response CSS and generation of a valid utility absent from the
   page hydration manifest. Do not assume runtime can recover a removed arbitrary
   native selector; managed keyframes follow their own published contract.
5. Compare cold loads and subsequent navigation with matching browser conditions.
   Keep deterministic bytes separate from transfer size, caching and timing samples.
   Coverage is a candidate list, not a deletion proof. If a budget is requested,
   use the project's existing checks and measured ceilings after behavior passes;
   there is no universal KB threshold or new budget API to install.

For unknown browser-only utility names, runtime/progressive generation remains
valid when the names are supported by the active manifest. Static extraction and
native pruning instead need sufficient source/usage evidence. CSS variables can
serve volatile values with one stable rule; do not impose a blanket ban on dynamic
utilities or switch rendering modes as an optimization default.

## Report the evidence at its actual strength

Name the checked source/build, routes, states and environment. Distinguish:

- Source/manifest/compiler inspection: matching, policy and generated output for
  supplied inputs; not proof that the app delivers that output.
- Production artifacts: files actually linked/imported and inline CSS; not proof
  of cache behavior or a faster paint.
- Browser checks: actual requests, computed styles and exercised interactions;
  not proof of all possible external content or untested states.

Keep unsupported pruning, unverified browser behavior and pre-existing failures
visible. A repair with correct CSS loaded but wrong computed styles returns to
[troubleshooting](troubleshooting.md#verify-a-repair), rather than adding another
full entry. Stop at the agreed task scope; optimize additional routes only when
requested or necessary to fix the same demonstrated regression.
