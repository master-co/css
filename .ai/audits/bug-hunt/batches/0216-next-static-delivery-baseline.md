# Batch 0216: Next static delivery baseline

The previous goal turn made progress by tracing a missing native event and establishing an explicit polling control. This batch bounds that host conclusion and resumes independent Next delivery work. Counts stay 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked; goal active.

## Pure native control

The new native-entry-watch.mjs uses only Node fs APIs: six independent owned directories, each rewritten through both, one and none while waiting for actual notifications. No Webpack, Watchpack or product imports. Native fs.watch and the explicit watchFile polling control each complete all six trials (18 observed edits per mode). All watchers are closed and directories removed.

These successful simple controls do not invalidate the two contextual failures in 0215. They prevent overgeneralizing those failures into a claim that native watching always fails. Root cause and default-route repair remain unresolved under the original workload. No polling default or dependency change is applied.

## Actual delivered Next functions

The new next-static-resource-delivery.mjs invokes the delivered stylesheet loader and static preparation/transformation independently for four owned source cases. It records generated CSS, actual loader dependencies, local resource targets, output files, errors and transformed imports. It does not start a Next server, make external HTTP requests, or claim full-build/browser correctness.

| Case | General stylesheet loader | Static preparation/transformation |
|---|---|---|
| Plain preserved native declaration | PASS | PASS |
| Direct local SVG with query/fragment | PASS; resource path exists | FAIL; generated CSS missing |
| Imported nested stylesheet with local SVG | FAIL; requires asset delivery | FAIL; generated CSS missing |
| Qualified external import | FAIL; requires asset delivery | PASS for retained import presence only |

General loader and static route each have 2 PASS / 2 FAIL. Three of four combined cases remain incomplete. The external static case preserves its qualified import in the transformed original entry rather than in generated next.css; that location is valid for this presence check. Its cascade and actual Next bundling remain unverified.

The direct and nested resource cases demonstrate that static createStaticCSS calls collection.compose without delivery settings. The current compiler deliberately rejects retained resource boundaries. StaticSession.write catches and logs the rejection, so prepareNextStatic and transformStaticStyleSource resolve and the loader emits an import of ../.master/next.css even though that file does not exist. The outer probe's ENOENT is evidence of the absent artifact; the underlying compiler error is retained earlier in the raw log. This is an unfinished BH-0004 integration path, not a new compiler failure or a new issue ID.

## Harness corrections

The initial plain-control assertion required unformatted color:red, while the actual CSS uses whitespace. The final assertion accepts CSS whitespace. Initial general-loader failures also prevented the static branch from running; the final probe captures them separately and continues the static check. The first external-import oracle looked only inside generated CSS; the final oracle checks both transformed entry and generated CSS. These script mistakes are not product bugs. Earlier logs remain immutable; use 0216-next-static-resource-final-oracles.log and 0216-parsed-evidence.json for final classifications.

Final cleanup disposes each owned scanner and stylesheet collection before removing its session key and temporary directory. Shared package artifacts and sources are read only.

## Capability discovery and next implementation

Next static mode must remain independent of @master/css-webpack and nextConfig.webpack, as required by its AI.md. Compiler collection.compose already exposes delivery callbacks and complete stylesheet/resource asset lists. CLI generate demonstrates complete asset consumption, captured resource bytes, revisioned CSS URLs and publication ordering, but its private CLI helpers cannot be imported upward into Next. The current Next implementation consumes only .css and has no asset publisher.

Next: add a focused Next-owned publication path using the existing compiler delivery API, consuming every CSS/resource asset and preserving original URL owners. Publish dependencies before the fixed entry, propagate explicit operation failures while allowing future queued attempts to recover, and validate resource updates, stale output and error recovery. Use an owned Next build copy and actual Turbopack builds after scoped tests. General stylesheet-loader retained import delivery remains a separate required path; do not close it merely because static publication passes. Preserve all existing fixtures/tests unless separately authorized.

## Preservation

All 597 inherited source hashes and 475 artifacts remain unchanged. Only two audit repros were added (599 source inventory entries). No product, package tests, fixtures, snapshots, dependency/lockfile/CI/release or foreign Site edits. HEAD/index unchanged, no commit or push. All owned commands/watchers are terminal. The two Webpack patch approvals and 0038 identity confirmation remain pending.

All 30 inherited remaining requirements are preserved verbatim in final-checks, with this precise Next baseline appended. Raw compiler, full host/maps/SSR/watch, root gates, cross-platform, Site and benchmark requirements remain unfinished. Recorded barriers do not count as completion.
