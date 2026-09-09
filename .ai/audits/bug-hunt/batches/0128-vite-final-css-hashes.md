# 0128 Vite managed CSS asset hash publication

- Started at HEAD1c6595586; continued after the explicit completed-audit commit2740faa60. Previous goal turn made progress by committing only0125–0127audit evidence and preserving85excluded files. This batch's product/test/reproduction work remains uncommitted.
- Scope: BH-0045, final managed CSS participating in Vite production asset names and all Vite-owned references. BH-0004's import graph/cascade migration remains unfinished.0038additional verification remains paused pending explicit identity confirmation.
- All103source/preservation hashes from0127still match. The Vite source changed separately in0128; it was not in those103paths. New source hashes record it explicitly alongside its HEAD version.

## Root cause and implementation

- The old style-entry build plugin replaced a managed CSS slot in `generateBundle`, after Vite assigned the asset's hash name. Two actual red/blue builds had different final bytes but the same CSS URL. [Original evidence](../evidence/0127-vite-final-hash.log).
- Reuse Vite's public output hooks: `renderStart` obtains the completed extraction after module transforms, then `outputOptions.assetFileNames` substitutes that CSS into the asset's naming-stage source before calculating its hash. `generateBundle` publishes the same cached extraction. The existing literal-slot replacement and duplicate-slot policy are unchanged; no CSS parser or semantic fallback was added.
- The plugin now has `enforce: post`, allowing its publication hook to see the single CSS asset emitted by Vite's CSS plugin during `generateBundle` when `cssCodeSplit` is false. Existing hook-level tests plus actual split/unsplit builds cover this order change.
- Vite still resolves HTML, JavaScript, dynamic CSS and preload references using the assigned names. There is no late asset renaming, reference text rewriting, timestamp nonce or cache bypass.
- Existing asset filename callbacks receive the extracted managed CSS at the actual naming stage. Non-managed CSS and non-CSS asset patterns remain unchanged. Default8-character and explicit12-character hashes, base64url/hex/base36 encodings, hash directory patterns and callback-owned source hashing are covered. Fixed filenames remain fixed; their cache policy belongs to the caller.
- The SHA256 input includes Vite's naming-stage asset text after managed CSS substitution. Vite can include naming metadata and perform later output processing: this is a content-sensitive cache identity, not a promise that the name equals SHA256 of the final disk file. The initial trace observed Vite's internal marker; production code does not inspect, strip or depend on that private marker. [Trace](../evidence/0128-naming-trace.log).

## Evidence

| Check | Result |
|---|---|
| Original actual red/blue reproduction |6PASS:3fresh +3retained-response controls; previously3FAIL |
| New focused hook regressions |4PASS; one extraction shared by naming/publication, callback source, encodings, fixed/unmanaged assets |
| Complete Vite suite |110PASS across19files |
| Vite lint/types/build |PASS |
| Actual output matrix |7modes ×3builds =21builds;39browser comparisons PASS |
| Progressive hydration and runtime mutation |36PASS across3bases,4HTML locations and3browsers;2mutations per page |
| Original Vite example production build |PASS, TypeScript and Vite |
| Root API census/package golden |Both remain FAIL; exact hashes unchanged from0126 |
| Compiler/runtime artifacts |5hashes unchanged; no runtime or Rust artifact rebuild |

- [Final original reproduction](../evidence/0128-hash-final.log): red is `assets/index-2NYSJXBH.css`; blue is `assets/index-B0aGYlfP.css`. The final CSS bytes retain their original red/blue SHA256 values from0127. Associated JavaScript names also differ and HTML references the correct files. Cache tests explicitly replay old responses only for URLs reused from the prior build; they do not test a real CDN.
- [Output matrix driver](../repros/vite-css-hash-matrix.mjs) covers relative base, nested absolute base with unsplit CSS, callback/hex, base36, hash directories, callback-owned SHA256 and fixed filenames. Each mode builds red twice and blue once. Both red builds have identical whole-output file maps and byte hashes. Changed CSS never reuses a hashed URL.
- Initial matrix39PASS did execute dynamic JavaScript, but managed CSS was deduplicated into the initial stylesheet, so it did not prove an independent lazy CSS request. The driver was strengthened with ordinary plus managed lazy CSS and asserts a new CSS URL after dynamic import for every split mode. [Authoritative expanded39PASS](../evidence/0128-hash-matrix-expanded.log); [initial weaker controls](../evidence/0128-hash-matrix.log). This is an evidence-coverage correction, not a product failure.
- Chromium, Firefox and WebKit check both the initial managed color and lazy background/border colors, missing requests and page errors, with fresh and replayed responses. Fixed filenames receive fresh-response controls only; automatic cache invalidation is not claimed for them.
- [Vite110](../evidence/0128-vite-tests-final.log), [lint](../evidence/0128-vite-lint-final.log), [types](../evidence/0128-vite-types-final.log), [build](../evidence/0128-vite-build.log), [hydration36](../evidence/0128-hydration.log), [example build](../evidence/0128-example-build.log). Vite README describes the naming contract and fixed-name limitation. No public directive semantics changed.
- Root failures remain API census `dc10f0ea4b46e12c21c6bdc6703bf56891d67411a80ad845344dba3bde6c45a4` and package golden `f9639a2aa06e5f161c529dcbdcd7f1407ab4f6d117f35c5c4927cb6bb0417c02`; no snapshots/goldens were refreshed. Installed Vite8.2.2 is the actual-build evidence environment; other major versions were not run here.

## Completion and direct handoff

1. BH-0045 is fixed for managed CSS in the validated Vite production publication path. The historical total stays45; now33fixed/12unresolved. This does not fix BH-0004's flattened imports or its late slot composition architecture.
2. Next resume0127's source-aware bundle segment design at the owning Rust compiler layer. Read existing parsed native rule/source ranges, represent ordinary-before/managed/ordinary-after and wrapper conditions without a TypeScript CSS parser, and reuse the graph compiler. Then migrate real Vite/Webpack registration and publish all CSS/resources in their original position. Preserve correct naming before references while adding this delivery route.
3. Keep the original legacy39browser failures, actual0127build6failures/browser24failures, no-delivery file/native CLI/no-export, source/watch lifecycle, namespace and resource bases, unlocated diagnostics,4root gates,4unclassified candidates and10blocked coverage units open. These old failure corpora were not rerun in0128; the hash fix is not evidence that they pass.
4. Hashing adds build-time SHA256 work proportional to naming-stage CSS size and caches one extracted CSS string per output render. No runtime hot path or runtime payload changed, so no runtime performance benchmark was run; no speedup is claimed.
5. Preserve other conversations' Site changes, existing fixtures/snapshots, dependencies, lockfiles and CI/release. All known0128jobs are terminal. No new commit/push;0038additional verification still requires explicit identity confirmation. Final preservation/context checks accompany this batch.
