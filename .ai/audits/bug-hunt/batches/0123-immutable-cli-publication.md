# 0123 Immutable CLI asset publication

- Started at HEAD912a73b26; the user-requested audit-only commit74e471917 saved completed0120–0122materials before this continuation. Previous goal turn made progress by committing that evidence and preserving unfinished implementation. Current HEAD74e471917.
- Bounded behavior: Node-host CLI file-export failures after composition, complete sidecars before entry replacement, collision preservation, and retry. BH-0004 remains partial; ownership/cleanup and other consumers are unfinished.
- Counts remain32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification still awaits explicit identity confirmation.

## Reproduction

- Both original actual-CLI tests failed. In an owned temporary project, an initial red export succeeded. Changing CSS/resource to blue and making the output directory0555 causedEACCES, but writable existing CSS sidecars had already been overwritten. The unchanged old entry then referred to changed CSS and an image that could not be copied. The process runs as the ordinary local user, not root.
- A second test manually changed a generated sidecar, then repeated the same export. The command silently overwrote those user bytes instead of rejecting the collision. Both failures belong to the existingBH-0004publication requirement. [Original2failures](../evidence/0123-publication-before.log).

## Change

- CLI first composes with stable provisional URLs, hashes the rendered entry/sidecar content, then composes again with revisioned sidecar URLs. CSS parsing, import rewriting and rendering remain in the existing compiler/Rust path; there is no TypeScript CSS transform. Generated classes and cascade semantics are unchanged; emitted dependency filenames intentionally change when rendered content changes.
- Resource bytes are pinned per publication, used both for their content-derived names and for writing the assets. Later filesystem reads do not substitute different bytes under a previously computed resource name.
- The new private CLI publisher checks every existing sidecar for exact byte equality and regular-file ownership shape. Matching files are reused; conflicting files, including symlinks, are rejected without overwriting them. This is collision protection, not a persistent ownership claim.
- New assets are completely written to exclusive temporary files beside their targets, then published with atomic, no-overwrite hard links. A competing publisher'sEEXIST is accepted only when complete target bytes match. Temporary files are cleaned up.
- All assets exist before a complete entry temporary file is atomically renamed into place. Existing output symlinks are followed without replacing the link, including dangling file links; existing entry permissions are retained. Write-protected entries remain write-protected.
- Old immutable generations are retained. No prefix-based deletion, persistent ownership manifest, crash journal, or automatic stale cleanup is implemented. A failed publication can leave complete, unreferenced new assets, which are reusable on retry and require later ownership-aware cleanup.
- Watch catches publication failures through its existing serialized recovery queue. After output permissions are restored, a later source/dependency change retries successfully. Permission restoration alone is not claimed to trigger retry.

## Evidence

| Check | Result |
|---|---|
| Original actual CLI publication regressions |2PASS after correction |
| Expanded publication controls |9PASS:2original,4concurrent same-output processes,watch retry,resource-link and entry-rename injected faults,existing/dangling entry symlinks,sidecar symlink collision |
| Full CLI suite |52PASS |
| CLI lint/type-check/build |PASS |
| AI context budgets and source/doc whitespace check |PASS |
| Source CLI + Chromium/Firefox/WebKit |12PASS: initial red, failed publication still red, successful retry blue, previous entry after success still red |
| Built CLI + same3browsers |Same12PASS; source/built emitted bytes identical |
| Repeated identical source/built export |All filenames and bytes unchanged |
| Previous built CLI export corpus |18PASS |
| Previous built watch recovery browser corpus |12PASS; missing-resource recovery and removed-import unsubscribe preserved |
| Root API census/package contracts |BothFAIL; exact output hashes unchanged from0122 |
| Compiler/runtime artifacts |All5recorded hashes unchanged from0122 |

- [First correction](../evidence/0123-publication-after.log), [expanded fault tests](../evidence/0123-publication-expanded.log), [full CLI](../evidence/0123-cli-tests.log), [lint](../evidence/0123-cli-lint-final.log), [types](../evidence/0123-cli-types.log), [build](../evidence/0123-cli-build.log).
- [Source browser](../evidence/0123-publication-browser-source.log), [built browser](../evidence/0123-publication-browser-built.log), [original exports](../evidence/0123-cli-built.log), [watch browser](../evidence/0123-watch-browser-built.log), [root gates](../evidence/0123-root-checks.json).
- Browser routes serve actual disk bytes. Every CSS/image request returns200 and image bytes match expected colors. The previous-entry control serves the previously captured entry bytes while resolving all dependencies from the current disk; it proves old dependencies remain usable after successful publication.
- Injected filesystem faults occur after at least one complete new sidecar exists. The old entry/CSS/resource bytes remain exact, temporary files are absent, and retry succeeds. These tests prove handled write-failure behavior, not power-loss durability.
- The first full suite had44PASS/1FAIL: its older watch assertion concatenated every CSS file on disk, including intentionally retained old generations. The corrected assertion follows imports reachable from the current entry and still rejects any reference to the old image. Independent browser requests also prove the active graph uses the new resource. No fixture/snapshot was changed. [Intermediate assertion failure](../evidence/0123-cli-first.log).
- All owned CLI processes, pages, browsers and temporary projects were disposed. No commit/push in this implementation turn.

## Costs and remaining requirements

1. Two compiler compositions per Node file export add CPU/allocation work; resource buffers are retained for that publication. Immutable generations add disk usage, and the watch output exclusion set retains previous asset paths. No performance improvement is claimed. No engine/runtime hot-path change, native/Wasm rebuild or runtime benchmark; those5artifact hashes are unchanged.
2. Next bounded batch: establish persistent per-output ownership and recovery before deleting any stale asset. Reproduce repeat runs, two output entries, unrelated matching-prefix files and user-modified assets; preserve every currently referenced file and the intended old-reader retention window. Do not infer ownership solely from names or reclaim matching preexisting files automatically.
3. Cleanup ordering must survive interruption and cooperating concurrent writers without deleting another entry's assets. Define how retained generations expire before implementing deletion; do not contradict the verified previous-entry behavior with immediate cleanup. Hard-link support, Windows sharing/rename behavior, hostile concurrent filesystem edits, crash/power-loss durability and cross-process deletion are not proven by the local4publisher control.
4. Continue existing file/project/build and`--no-export` graph consumers, inline/runtime resource bases, namespace/external URL-base forms, reference/source policies, managed-entry recreation and source deletion. Latest legacy public corpus0121still has39failures; these consumers were not switched here.
5. All12unresolved findings,10blocked coverage units,4root gates,4unclassified candidates and the0038identity pause remain unfinished. The full goal is active.
