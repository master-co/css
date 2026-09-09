# 0124 CLI asset ownership, retention and recovery

- Starting/current HEAD74e471917. Previous goal turn made progress:0123immutable publication and old-entry reader protection were implemented and verified. All85recorded0123source/preservation hashes matched before this batch.
- Bounded behavior: persistent ownership across Node CLI invocations, retained generations, safe cleanup with multiple outputs, and recovery of interrupted publication journals. BH-0004 remains partial because other consumers and contract edges are unfinished.
- Counts remain32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification still awaits explicit identity confirmation.

## Baseline and scope decisions

- The actual CLI did not create any ownership record; the new cross-run/two-output regression failed at the missing journal assertion. Existing0122/0123evidence already showed stale sidecars retained indefinitely. This is the knownBH-0004asset-lifecycle gap, not a new problem ID. [Baseline](../evidence/0124-ownership-before.log).
- An optional user preference question offered retention choices. No answer arrived during this batch; the stated default was used: retain current and previous successful generations, and retain older generations for at least24hours after replacement. This is an implementation assumption, not user identity confirmation. Cleanup occurs on later successful exports, not on a timer.
- Existing capabilities were inspected: the MCP package has a private, tested filesystem bakery gate. CLI must not import that adapter's private module or add a generic utility to the integration kernel. A CLI-local adaptation uses the same algorithm without adding dependencies or changing MCP. Scope remains cooperating processes of one OS account on a coherent local filesystem.

## Implementation

- Each output has a hidden `.<entry>.master-css.json` journal. It records current/retained generations, referenced filenames and actual created-asset identities: device, inode, birth/modified timestamps, permission bits andSHA256. Existing identical files are reused without acquiring ownership. Metadata names/entries, hashes, timestamps, identities and contained asset filenames are validated; invalid state stops publication before replacing output.
- Complete asset and entry temporary files are prepared first. Their identities and a pending generation are journaled before any new sidecar is linked into place. An asset file appearing from another writer is accepted only when bytes match; a different identity does not acquire ownership.
- The entry is atomically replaced, then the journal promotes the generation. If a process stops between entry replacement and final journal save, the next invocation checks both entry identity and bytes to determine whether publication completed. An uncommitted pending generation is discarded without discarding proof of created sidecars.
- Journaled temporary files are removed only when their current identities still match, including entry temporaries beside a symlink target in another directory. Modified or replaced temporary files are preserved. Process termination before the first journal write can still leave unjournaled temporary files; the implementation does not infer their ownership from a prefix and does not claim to collect them.
- A private account-wide gate serializes publication and cleanup, including independently started CLI processes and path aliases. Unique PID/UUID bakery registers are published atomically; confirmed dead owners can be reclaimed without deleting a successor's register. Live or uncertain owners are never expired; contenders time out after30seconds. The empty gate directory remains to avoid directory-generation races.
- Cleanup retains the current generation, the most recent previous generation regardless of age, and other generations until24hours after retirement. Other journals in the same output directory pin their referenced assets, even when those outputs merely borrowed existing bytes. A borrowed output may conservatively retain old references until it next runs.
- Only recorded created assets with exact current identity and bytes can be deleted. User writes, replacement, touch, permission changes or symlink replacement relinquish ownership. Unrelated matching-prefix files and matching preexisting files remain untouched. Missing files lose their ownership record.
- Cleanup failures warn after successful publication and retain retryable debt. Journal-finalization failure can instead report failure after a valid new entry is already published; retry resolves its pending state. Neither path claims rollback or power-loss durability. Public CLI README documents retention, journals and these boundaries.

## Validation

| Check | Result |
|---|---|
| Actual CLI ownership/two-output/reused-external-assets regression |PASS |
| Full CLI suite |71PASS across16files |
| Ownership/cleanup controls |13tests: expiry boundary, indefinite previous generation,5user-modification forms,unowned files,borrowed references,entry/journal faults,cleanup retry,abandoned pending assets,malformed paths |
| Actual publisher process termination |4SIGKILLworkers recover: before assets,before entry,after entry,and before entry through a cross-directory symlink; journaled temps and dead gate registers cleared |
| Live-owner timeout |PASS; contender never enters or steals the live owner's register |
| Source publisher stress |6OSworkers/120serialized sections;2outputs,shared borrowed asset,clock-advanced cleanup; no missing references or overlapping writer |
| Built publisher stress |Same120sectionsPASS; both runs leave only4retained generation assets,shared asset and unrelated user file |
| Actual source CLI retention +3browsers |18PASS |
| Actual built CLI retention +3browsers |18PASS |
| Previous source/built publication browser corpus |12PASS each |
| Previous built export/watch browser corpora |18PASS/12PASS |
| CLI lint/type-check/build |PASS |
| AI context budgets/source-doc whitespace |PASS |
| Root API census/package contracts |BothFAIL; exact output hashes unchanged from0123 |
| Compiler/runtime artifacts |All5hashes unchanged from0123 |

- [Full final tests](../evidence/0124-cli-tests-final.log), [initial cleanup17controls](../evidence/0124-cleanup-tests.log), [lint](../evidence/0124-cli-lint-final.log), [types](../evidence/0124-cli-types-final.log), [build](../evidence/0124-cli-build.log).
- [Source stress](../evidence/0124-ownership-stress-source.log), [built stress](../evidence/0124-ownership-stress-built.log), [source retention browser](../evidence/0124-retention-browser-source.log), [built retention browser](../evidence/0124-retention-browser-built.log).
- [Source publication browser](../evidence/0124-publication-source.log), [built publication browser](../evidence/0124-publication-built.log), [built export](../evidence/0124-export-built.log), [built watch](../evidence/0124-watch-built.log), [root gates](../evidence/0124-root-checks.json).
- The retention driver launches the actual CLI binary/entry in child processes and controls only their`Date.now`. Real filesystem identity/write/delete behavior is exercised; it does not claim24hours of wall-clock observation. Chromium/Firefox/WebKit load real emitted CSS/images. Old red remains usable just before expiry; after expiry current green, previous blue and another output's red all remain usable. Previous blue also works at the controlled30-day point. Modified/unrelated files and every byte of the other output's entry,journal andassets are preserved.
- Source and built publisher stress directly invoke their real private publication/gate modules, rather than the CLI argument parser. An exclusive-create sentinel proves critical-section exclusion; each section checks both outputs' current/retained dependencies and advances a shared counter.240total sections complete; all12workers exit0 and gate registers are empty. Actual CLI/browser tests separately cover command integration.
- First post-change run had9PASS/1FAIL because an older watch assertion expected every non-entry file to remain byte-identical after successful publication, including the newly mutable ownership journal. It now compares old published assets while separate ownership tests verify journal transitions. The browser driver's source/built byte comparison likewise excludes local ownership metadata. This is a test-scope correction, not a product finding. [Intermediate assertion failure](../evidence/0124-ownership-after.log).

## Costs, limits and direct handoff

1. Node CLI adds journal writes, identity/hash checks, directory/journal scans and account-wide serialization. Metadata and retained generations consume disk space. No speed or memory improvement is claimed. There is no engine/runtime hot-path change; no runtime benchmark or native/Wasm rebuild was needed, and all5artifact hashes remain unchanged.
2. The bounded new-protocol ownership/retention/recovery behavior is verified. Unjournaled pre-publication temps, preexisting unowned assets, older/external writers, cross-user or network-filesystem coordination, power-loss durability and exhaustive filesystem interference remain outside the evidence. Retention protects only the stated window plus current/previous generations; it cannot keep every historical entry alive forever.
3. Next return toBH-0004's existing file/project/build and`--no-export` consumers. Inspect `packages/compiler/src/node-compiler.ts` (`compileCSSFile`, `compileCSSManifestFile`, `compileProjectManifest`) and `src/project/manifest.ts`, then map their result contracts/downstream asset publishers before changing them. The latest legacy public60-case corpus0121still has39failures; no legacy consumer was switched by this batch. Do not turn an explicit error fallback into completion.
4. Keep inline/runtime resource bases, namespace/external URL-base forms, reference/source policies, unlocated/flattened-source diagnostics, managed-entry recreation and source deletion in scope. Preserve the original public corpus and existing graph/CLI controls while addressing each behavior.
5. All12unresolved findings,10blocked coverage units,4root gates,4unclassified candidates and0038identity-gated checks remain unfinished. The full goal stays active. No commit/push; other conversations' Site changes, fixtures/snapshots, dependencies, lockfiles andCI/release remain preserved.
