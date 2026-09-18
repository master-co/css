# Batch 0205: Host classification and delivery

Bounded investigation of BH-0004 and the remaining Next/Webpack host boundaries. Product repair remains unfinished; no new finding ID. The user-approved 0203 single-line LSP expectation migration remains complete (42 tests). The 0038 identity-confirmation pause remains in force.

## Baseline and scope

- Start from 0204: 565 source hashes and 471 artifact hashes match exactly; HEAD `3b5c98d61c6dc69ee3546d9d4f822e9e835f308e`, empty index.
- Read AGENTS, context index/package routing/accuracy/bugfix, current compiler delivery APIs, Next/Webpack manifests, package AI and nearby loader/plugin sources; deeper architecture/data-flow/testing references remain loaded from preceding batches.
- Two real built stylesheet loaders, isolated loader contexts: three import qualifiers × root `@master entry` absent/present = 12 observations. Child CSS contains an external import and Master entry.
- Actual Webpack production static builds: the same six graphs with/without external CSS = 12 builds per mode. Successful builds compared against independently served author CSS in Chromium/Firefox/WebKit, screen/print. All external requests intercepted locally; no external service access.
- Four modes: current delivered plugin; classification-only candidate; pure Webpack with Master directives and plugin removed; classification candidate plus an audit-only asset publisher using the existing compiler graph API.
- No actual Next build, development/watch/HMR, SSR, Sass, CSS Modules, source-map, content-hash/cache, multi-entry or resource-payload coverage is claimed by this corpus.

## Results

| Mode | Build PASS / FAIL | Browser PASS / FAIL | Meaning |
|---|---:|---:|---|
| Current delivered Webpack | 8 / 4 | 39 / 9 | Two unqualified external cases refuse missing delivery; two qualified root-entry cases fail flattening. Qualified imported-entry cases build with wrong cascade/media behavior. |
| Classification-only candidate | 6 / 6 | 36 / 0 | All six external graphs now reach the explicit asset-delivery guard. This is not a repair. |
| Pure Webpack native CSS experiment | 12 / 0 | 54 / 18 | Named-layer external CSS is hoisted outside its layer; print-qualified external CSS applies on screen. Both root-entry variants become identical pure controls. |
| Audit-only full graph publisher | 12 / 0 | 72 / 0 | Existing compiler collection/delivery and Rust bundle APIs can preserve this bounded corpus when every emitted stylesheet is published. No production change delivered. |

The current plugin's nine incorrect browser results are reproduced by the corresponding pure Webpack cases. Do not attribute those observations exclusively to Master CSS or create a duplicate finding. The Master integration's flatten/classification and missing-delivery failures remain its own unfinished BH-0004 work. Host-native behavior does not waive the requested end-to-end delivery requirement.

Loader evidence: current Next has two qualified imported-entry cases incorrectly returned unchanged with zero recorded dependencies, two flatten errors and two missing-delivery errors. The classification candidate tracks dependencies for all six graphs but all six Next cases still fail asset delivery. Current Webpack loader has two untracked unchanged cases, two flatten errors and two successful virtual replacements; candidate has six successful replacements with dependencies. Those loader successes alone do not prove the plugin publishes the child assets.

## Candidate and experiment boundaries

- `repros/host-classification-candidate.patch` changes only six `preserveImports` options across five source files in disposable package copies. Both copied packages build successfully. This patch was **not applied** to the workspace and no candidate artifacts were promoted.
- `repros/webpack-delivery-experiment.mjs` replaces internal callbacks only on the plugin instance owned by a disposable build. Collection composition supplies delivery URLs; the existing compiler prepares/renders the complete bundle; a test hook emits all CSS assets. This is an experimental host bridge, not a supported public adapter or a shippable implementation.
- All CSS semantics remain in the existing compiler/Rust graph APIs. The experiment does not rewrite selectors/import conditions with string logic.
- Early matrix logs filtered dependencies using `/var/...` against Webpack's canonical `/private/var/...`; that observer omitted some entries. No missing-watch-dependency conclusion is drawn from those early stats. The final repro canonicalizes its temporary root and reruns all four modes. This is a repro observation correction, not a product fix.
- Production sources, existing tests/fixtures/snapshots, shared build configuration, dependencies/lockfiles/CI/release, Site changes and all 471 live artifacts remain unchanged. No shared dist build, foreign host restart, commit or push.

## Reproduction

From repository root, with already installed dependencies:

```sh
node .ai/audits/bug-hunt/repros/host-loader-import-boundaries.mjs
node .ai/audits/bug-hunt/repros/webpack-import-boundaries.mjs
BH_PURE_WEBPACK=1 node .ai/audits/bug-hunt/repros/webpack-import-boundaries.mjs
```

For candidate loader observations, supply `MASTER_NEXT_LOADER` and `MASTER_WEBPACK_LOADER` pointing at the disposable built loaders recorded in `evidence/0205-candidate-state.json`. For candidate builds supply `MASTER_WEBPACK_PLUGIN` pointing at that copy's `dist/index.js`; add `BH_GRAPH_DELIVERY=1` for the publisher experiment. Never point a package build at the shared live output.

Evidence: `0205-loaders-{before,candidate}.json`; early `0205-webpack-{before,candidate,pure,delivery-experiment}.log`; canonical-path final `0205-webpack-{delivered,classification,pure,delivery}-final.log`; `0205-matrix-results.json`; final source/artifact inventories and `0205-final-checks.json`. Early logs are retained verbatim. Nonzero matrix exit codes report intentionally retained product/host failures.

## Direct next step

1. Implement production Webpack static graph delivery using its existing collection, compiler bundle APIs and asset hooks. Extend the context to carry the complete composition, publish every stylesheet/resource at its final URL and record dependencies in the active compilation. Replace the audit callback overrides with package-local source and focused tests.
2. Test surrounding ordinary CSS, multiple slots/entries, asset directories/publicPath, resources, actual content hashes/cache invalidation and maps before promotion. Preserve complete CSS boundaries through Webpack's native parser/minifier. Existing native host failures require shielding through the graph publisher, not merely classification changes.
3. Finish scoped/full serial Webpack tests, lint/types, isolated build and example validation, then atomically promote complete artifacts only after source/artifact preservation checks. Formal parallel-test isolation remains separate unfinished work.
4. Next needs its own loader/static delivery lifecycle, including actual Turbopack and Webpack builds; do not extrapolate this Webpack experiment to Next. Keep BH-0051/BH-0053 limits and intermittent Sass observations.
5. Continue every remaining requirement copied into `0205-final-checks.json`, including raw native/Wasm 20 qualified failures and 39 raw external failures, Vite recovery, root gates, compiler/Wasm test environment/migration, benchmarks, Site and all 10 blocked units. Recorded blockers are not completion. No identity confirmation has been received for 0038.

Final verification and preservation are recorded in `0205-final-checks.json`; goal remains active (this turn made independent progress).
