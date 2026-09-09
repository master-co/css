# 0167 Imported module exports

## Baseline and scope

- Previous goal turn made progress:0166 repaired three local delivery defects;338 Vite tests and324 browser observations passed.233 source hashes match;HEAD fe170da1b.
- Compare CSS Modules @import and cross-file composes with pure Vite, including plain CSS and module children. Use actual exported names and stylesheet contents before choosing a fix.
- BH-0004 remains unfinished.47 historical/35 fixed/12 unresolved;10 blocked coverage,4 root gates,4 original candidates and1 host shutdown limitation remain. Batch0038 identity confirmation is still absent; do not execute paused additional verification. No commit/push.

## Current evidence — fix still pending

- The first four actual-server comparisons yield2 FAIL/2 PASS: both plain CSS and module children lose root @import exports; cross-file composes matches pure Vite. The first inline diagnostic used a callback that included ?inline in a CSS name; the test callback now strips queries to avoid that unrelated invalid-name artifact. The missing export result was already present in the ordinary module request.
- Full current Vite suite:340 PASS/2 FAIL across53 files. Both failures are the new @import regressions; original338 and two composes controls pass. Do not replace this with0166's all-green claim.
- Actual dev/build browser matrices:240 observations,144 PASS/96 FAIL. All four Master modes fail @import exports for plain/module children, across Chromium/Firefox/WebKit and900/500px. Pure Vite and all composes controls pass. The wide target loses32px padding because the exported child name is missing; narrow checks still detect missing exports.
- A focused48-observation extension finds24 PASS/24 FAIL. With a plain CSS child, the plugin applies32px padding to an unrelated global .child element at900px in all three browsers, in dev and build; pure Vite remains0px. Module children instead receive their own scope, which still does not match root exports. The original browser script is preserved in evidence/0167-module-browser-initial.mjs with its hash.

## Capability discovery and prototype

- prepareBuildSassSource currently hides @import from Vite's postcss-import before Modules processing. Vite therefore scopes/exports only the root; the compiler import resolver later loads children outside that root Modules context. Restoring naive Vite flattening would reintroduce the qualified/external import boundary losses already documented underBH-0004.
- Existing Rust stylesheet graph nodes own authored import statements, UTF-16 ranges and resolved targets. The Node preparation helper is internal; the public bundle API operates on already assigned distinct hrefs. Do not import compiler private helpers into Vite or recreate import parsing in TypeScript.
- A bounded Vite preprocessCSS/PostCSS-hook prototype places child/root source inside opaque envelopes and runs Modules once. It returns both exports with root scope, keeps @compose untouched, and captures each transformed segment. It is a feasibility probe, not a production fix.
- Extending the probe to composes from nested/shared.module.css shows injected shared CSS outside those envelopes has no source.input.file, and its relative resource URL stays ./pixel.svg. No claim is made that the probe preserves resource ownership or source maps. Default/custom generateScopedName source arguments, global/keyframe/ICSS exports and repeated imports also need faithful treatment.
- Next: preserve a single host Modules scoping context while retaining Rust-owned import edges and source ownership; determine the required lower-layer public preparation/projection contract before adding Vite orchestration. Cover qualified/external imports, sibling collisions, custom scoped-name callbacks and composed resources. Then make the two seeded regressions and browser matrices pass; do not weaken them or silently flatten unsafe imports.

## Preservation and scope

- No production implementation changed this batch. Public Vite/Site docs now state the confirmed imported-export/global-selector limitation; prior root-only controls remain historical evidence, not full Modules coverage. Existing fixtures, snapshots, dependencies and other Site changes remain untouched.
- Batch0167 remains the current in-progress batch. No commit/push. All other original findings, root gates, candidates, host shutdown limitation and batch0038 identity pause remain unfinished; recording a blocker does not complete it.

## Verification checkpoint

- Vite lint/types PASS. Site prepare/lint PASS with0 errors/75 existing warnings. Repro syntax, whitespace and AI context checks PASS.236 source hashes recorded;233 baseline includes231 unchanged files and2 documentation edits, plus3 new test/repro sources. Five artifacts and foreign Site files are byte-identical; resource cache directories absent; index empty.
- All commands are terminal. This is a verified investigation checkpoint, not a completed fix or closed finding. Resume batch0167 from the scoped-context/source-ownership design and the two failing regression tests.

## Implementation checkpoint before the requested commit

- The preceding investigation checkpoint is historical. An initial implementation now projects the host Modules result back to each original source while retaining authored imports. Child identities include their owning root; Vite keeps the final source-map chain. Compiler adds an explicit transformNativeStylesheets delivery option for host-prepared native graphs. These product changes remain uncommitted and are not a completed fix.
- Compiler suite:243 PASS/33 files. Initial Vite implementation suite:336 PASS/6 FAIL; two source-map regressions were corrected by preserving Vite's final map chain. The relevant33 tests then PASS; the latest complete Vite log reports346 PASS/54 files. Four sibling-root scope/keyframe/resource/HMR controls PASS. Original failing logs remain available; the other four initial failures are not classified as environmental without evidence.
- Latest logs:0167-compiler-tests-first.log,0167-projection-map-focused.log,0167-module-contexts-first.log and0167-vite-tests-map-fixed.log. Lint/type logs contain no diagnostics, but their original terminal handles and the latest full-suite exit status cannot be recovered at this commit checkpoint; do not invent exit codes. No matching test/lint/type process remains.
- Next: rebuild compiler then Vite after consumers finish, rerun both imported-module dev/build browser matrices including global-leak controls, and add actual HTTP/resource bytes/pixels and source-relative ownership controls. Verify conditional/external imports, maps and composed resources. Refresh public docs and check the new public option against API gates; confirm lint/types exits. The previous browser failures describe the pre-implementation code, not a new run of the current source.
- The user now authorized committing completed work. This commit includes completed audit observations and this handoff, but excludes all product/package-test changes because the BH-0004 dependency chain and this implementation are unfinished. Batch0038 identity pause and every other unfinished item remain unchanged. No push.
