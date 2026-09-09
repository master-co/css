# 0122 Watch recovery after missing stylesheet dependencies

- Starting/current HEAD912a73b26. Previous goal turn made progress by correcting original-source ranged diagnostics. All78recorded0121source/preservation hashes matched before this batch.
- Bounded behavior: actual Node CLI file-export watch after imported CSS/resource deletion, a new missing import/resource, and startup with missing dependencies. Preserve the last exported files during dependency-preparation failures, include intervening source edits on recovery, and stop watching removed imports.
- BH-0004 remains partial. Counts stay32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification still awaits explicit identity confirmation.

## Reproduction and corrections

- Initial5actual CLI regressions all failed: deleting an existing resource/import, introducing a missing resource/import, and starting with a missing resource exited the watch process. Reset closed all watchers before preparing the next graph, and rejected asynchronous dependency handlers were not caught. [Original failures](../evidence/0122-watch-before.log).
- Rebuild and source-write operations now share a serial queue whose handled preparation failures do not poison subsequent operations. A failed pipeline remains inactive for publication until a complete prepare/scan/compose succeeds. Existing output files are unchanged when dependency preparation fails.
- Watchers stay active during rebuild. Successful attempts replace dependency subscriptions; failed attempts retain previous subscriptions and add newly attempted files. Initial dependency failure also keeps the watch process running.
- A new optional Node delivery `onDependency(file)` reports attempted stylesheet/resource paths before file availability is required. CLI records these paths; the internal filesystem graph helper propagates the callback into imported CSS and reference graph preparation. CSS semantics remain in Rust.
- Merely adding nonexistent deep file paths did not reliably observe later directory creation. Dependency watchers now start at the nearest existing parent directories and filter to exact dependency paths/their required ancestor directories. Replacements become ready before previous watchers close. Missing-file existence is rechecked after registration to cover creation during the initial watcher scan.
- Both source and dependency watchers exclude this invocation's output files. Successful graph updates remove obsolete dependencies from monitoring. Node process shutdown waits for queued work before disposing its watchers/scanner.
- The initial post-fix run also had two script-only failures: it expected literal `color:blue`, while valid printed CSS used `color: #00f`. Assertions now accept the equivalent spellings; actual computed-color browser checks independently verify the result. The remaining new-directory failures were product/implementation gaps and were fixed separately. [Intermediate evidence](../evidence/0122-watch-after.log), [directory gap](../evidence/0122-watch-ready.log), [first5passing](../evidence/0122-watch-parents.log).

## Final evidence

| Check | Result |
|---|---|
| Expanded actual CLI recovery cases |6PASS: deleted/imported resource, deleted import, new missing resource/import, initial missing resource/import |
| Edits during a failed rebuild |All6cases keep running; subsequent HTML edits trigger retry and appear in recovered CSS; a later normal edit also succeeds |
| Full CLI suite |43PASS |
| Full compiler host suite |194PASS |
| Actual source CLI + Chromium/Firefox/WebKit |12PASS across initial, missing-resource/further-edits, restored and import-removed states |
| Actual built CLI + same3browsers |12PASS across the same4states |
| Previous built CLI export corpus |18PASS |
| CLI/compiler lint, type-check and builds |PASS; builds complete before tests consuming their artifacts |
| Site guide lint/prepare |PASS;0errors/75existingwarnings |
| Root API census/package contracts |BothFAIL; output hashes unchanged from0121 |
| Compiler/runtime artifacts |All5recorded hashes unchanged from0121 |

- [Expanded recovery tests](../evidence/0122-watch-expanded.log), [CLI suite](../evidence/0122-cli-tests.log), [compiler suite](../evidence/0122-compiler-tests.log), [source browser](../evidence/0122-watch-browser-source.log), [built browser](../evidence/0122-watch-browser-built.log), [built export](../evidence/0122-cli-built.json).
- Browser pages load the real exported disk bytes through owned routes. Every requested stylesheet/image returns200, computed colors remain red during missing-resource edits then update to blue after restoration, and removing the import produces green/no image requests. Source and built drivers also prove editing the removed CSS no longer triggers a reset. Processes, pages and temporary projects are disposed.
- Both browser runs confirm stale red/blue SVG sidecars still remain on disk after the import is removed. This is explicit unfinished cleanup evidence, not a completed cleanup claim.
- No Rust, native/Wasm ABI, engine/runtime hot-path or runtime bundle change in this batch. Prior Rust/binding evidence remains tied to unchanged sources/artifacts; no rebuild/benchmark or performance gain is claimed. Watch subscription bookkeeping adds Node filesystem work. [Artifact hashes](../evidence/0122-artifact-hashes.json), [root gates](../evidence/0122-root-checks.json).

## Remaining requirements and direct handoff

1. Next bounded batch: reproduce failure during asset publication, after composition succeeds. In an owned temporary project, make the output directory unwritable, change a resource so its destination name changes, and check whether previously published CSS/assets remain usable. Existing sidecar CSS names are based on source identities and can be overwritten before the final entry write; preparation recovery alone does not establish publication atomicity.
2. Design publication/cleanup ownership from actual evidence. Publish a complete new asset set before switching the entry; remove only verified assets owned by that output after successful publication. Preserve unrelated files, other output entries, and user-modified assets. Current watch and cross-run stale-sidecar cleanup remain incomplete.
3. Permission/write failures, package-style/reference-resolution failures, creation/recreation of managed entry roots, source-file deletion, multiple outputs, cross-process publication and exhaustive reload combinations are not closed by these6recovery scenarios. Do not infer them from the process-survival checks.
4. Continue the existing file/project/build and `--no-export` graph consumers, inline/runtime resource bases, remaining diagnostics and URL/reference/source-policy edges. The latest legacy public corpus0121still has39failures; this batch does not switch those consumers.
5. Preserve all12unresolved findings,10blocked coverage units,4root gates,4unclassified candidates and the0038identity pause. No full-goal completion claim.

The bounded dependency-recovery behavior is verified. CLI/compiler implementation, new tests/repro, public docs and0122materials remain uncommitted. No push, fixture/snapshot/dependency/lockfile/CI/release change. Foreign Site changes remain preserved; source hashes, inventory and final context check accompany this batch.
