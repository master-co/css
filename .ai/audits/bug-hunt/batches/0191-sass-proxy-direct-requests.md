# Batch 0191: Sass proxy direct requests

- Bounded direct-proxy repair verified;511sources recorded from0190 owner follow-up. Reproduce internal CSS proxy?direct500 from0181 and fix public HTTP-to-filesystem resolution while preserving base paths, query modes, CSS Module exports, resource ownership and host filesystem access controls.0190 still has3failures;all4openIDs/fullrequirements remain;0038identity confirmation not received. No commit/push.

## Verified implementation

- Original16HTTP tests all reproduced500 across Sass/SCSS, four modes and root/base paths. The existing resolveId shortcut treated browser root-relative proxy paths as filesystem absolute owners. Serve-mode proxies now resolve the original owner through Vite, then retain the prepared CSS identity and query. Build identities and encoded Modules exports retain their existing paths.
- First canonical resolution exposed denied-owner CSS through a virtual proxy (2new access testsFAIL); fixed before completion by a small middleware that resolves the original owner and uses Vite isFileLoadingAllowed before responding. Root/base, CSS Accept/explicit direct, nested resource MIME/query/fragment, reference updates and SSR exports pass. Access tests cover allowed outside-root files with spaces, outside-denied and fs.deny files, including encoded internal module URLs. Final19testsPASS; no existing test/fixture/snapshot edit.
- Full Vite suite640PASS/3FAIL (643tests,70files). All3failures are retained0190 regressions: custom include, cache exclude, config-failure cleanup. Owner preservation remains fixed. Vite lint/types/buildPASS. No compiler/Rust/native/Wasm rebuild or engine/runtime hot-path change.
- Built-plugin browser48PASS: four modes ×two Sass syntaxes ×Chromium/Firefox/WebKit ×initial/reference-HMR. A sole native CSS link loads the emitted proxy; padding32→112px, red resource pixels, base/query/fragment and boot identity remain correct. Runtime injection disabled to isolate this delivery path; full hydration/SSR matrices remain separate requirements.
- Initial browser harness put an already base-prefixed emitted URL into authored HTML; Vite added base again and produced/base/base/500. Diagnostics confirmed the duplicate URL. Corrected only the harness's authored asset path so Vite applies base once; first failure and diagnostic logs retained.
- Vite6.0.0 publicUtils exports isFileLoadingAllowed; installed6.4.3 uses the same config/file signature. This is API availability evidence, not a full older-host compatibility run. [Official export](https://raw.githubusercontent.com/vitejs/vite/v6.0.0/packages/vite/src/node/publicUtils.ts).

## Remaining scope

- The specific internal proxy direct-request500 is repaired; BH0004 full graph/public consumer migration is not complete.0190 has3concrete failures. BH0029/0051/0053, ten blocked coverage units, root gates, original candidates, complete host/resource/source-map/SSR matrices, benchmarks and Site revalidation remain.0038 identity confirmation not received. Goalactive;no commit/push.

- Original Vite example build PASS. Final source/artifact preservation and context-budget records are linked in [final checks](../evidence/0191-final-checks.json). Site sources and existing fixtures/snapshots/dependencies/lockfiles/CI/release retained; no Site validation rerun or full-goal completion claim.
