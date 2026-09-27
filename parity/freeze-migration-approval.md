# Freeze migration QA approval

User QA was received in Codex task `01a0dbdd-0a03-7673-9933-a64a98fd1de5` and recorded at `2026-09-27T16:12:20Z` (2026-09-28 in Asia/Taipei). The user explicitly approved both review requests. This is a new approval of the scopes below, not a reuse of earlier implementation authorization.

## Three contract records

Response to request `call_GSl70xiBTXFDAvO1PwMCsX03`, item 0: the user approved the three contract updates. The review was `migration-approval-scope.md`, backed by the frozen `migration-contract-review.json`, HTML and full source patch.

Frozen report target: `3561220d4e2c42af41077931948b32261da1f40b`. Report JSON SHA-256: `e5fc3430c19a408a3e2dc3001f04ff5c2e2074637c9174a760d47c7202b29a54`. The approved case and surface digests were checked against the current committed package target before recording.

1. Next ordinary CSS/SCSS/Sass enters the stylesheet loader without a directive-content gate. Its rule excludes CSS Modules, generated output paths and manifest queries; CSS Modules use their separate project-context rule. Existing progressive mode and ESM manifest delivery remain.
2. The public inventory removes `MasterCSSManifestUtilityKind` and `MasterCSSManifestUtilityMatcherValueSegments` from `@master/css-schema/manifest`, and records ABI 13/language version 3. Package entrypoints do not change.
3. Binding ABI advances from 11 to 13 and language version from 2 to 3. Other recorded protocol versions remain unchanged.

| Record | Approved target digest |
| --- | --- |
| `rc87-bc7adf7569796dc8` | `6acfe4d189cfa974bcecaf2ad5713cb1d83eae6da099757699f4f6f2c8e9cf4d` |
| `public-api-contract` | `a4efe9c284c329734df1bd19428a70fe05ca5669eaa6ecfb37bca3c284312648` |
| `binding-version-contract` | `caf4b8e6f33f7b9e5c26a6cd4f9bb92d6a581e2a116e2bcb3091bfc18d0ab243` |

The previous reviewed targets, baseline digests and exact changed fields remain available in Git history. These three approvals do not approve the remaining changed or unmatched Rust-refactor cases.

## Manifest loading adaptation

Response to request `call_IE41F2vn2nZgHGVjjjtz3S1y`, item 0: the user approved the supplemental contract update in `post-rc87-adaptation-review.md`.

Decision: `post-rc87-browser-manifest-import-fallback`. Previous reviewed target: `dd8a5c548bfa8c7a5f0ccb4650f3b458b2b560f5`. Approved target snapshot: `147dbcd4d8b2b79cf2b7e307760bb014befff5d4`. Full eight-file old/new patch SHA-256: `82b4c762b966df12b52766fd469832670784c944d1c7f38f8101fdb7924d5469`.

The shared browser facade keeps JSON import attributes first and fetches only after loader-construction SyntaxError. Its universal server branch imports the supplied asset URL. Next emits standard ESM data and leaves asset delivery to the bundler. Runtime hydration uses direct dynamic JSON imports without loader construction or a fetch fallback; failures remain structured diagnostics. The review also includes language version 3 fixtures, progressive-state assertions, and current utility/token fixture syntax.

All eight current files matched the approved snapshot byte for byte. Twelve of the 21 cases keep their digest; four change and five change with an approved rename. The modulepreload `as="json"` bytes remain unchanged.

The original implementation provenance remains `becef751987086ffe7a93cdbd6985f1ac0158c08`, including the recorded runtime file splits. That commit identifies the initial adaptation, not the later reviewed bytes; the two snapshot commits above identify this supplemental review.

| Approved file | SHA-256 |
| --- | --- |
| `packages/internal/src/manifest-facade.ts` | `0f4c306318b71d35cf4fed2e6560601ed8a64360ee87f6c3555553e08cf35f30` |
| `packages/internal/tests/module.test.ts` | `8f048785d4de1a0813f58aa28379455f289d72aa1fc40314f6607ee863dd1620` |
| `packages/next/tests/css-manifest-loader.test.ts` | `599b3566096d66fac471824dcc97f639c33cb7621d8602afc38f976a9e6b762d` |
| `packages/runtime/src/hydration.ts` | `5b6d189a11c3aac3d2881b23047fcb48f2bffcb6d94d1d20b626bd3db4a2ce3f` |
| `packages/runtime/e2e/hydration-edge-cases.test.ts` | `73f0ddbc1dd5f605a1b237b529c5f2dfab39f109636c0fd30b9e5a712110732e` |
| `packages/vite/tests/plugins/manifest-loader.test.ts` | `c7b9ed2b0cff059c0ea0c637e7356b277e56ac58cb8bf52607de4ff8221fcb32` |
| `packages/vite/tests/plugins/manifest-virtual-module.test.ts` | `ed2e70cfd4b0095b6dd625c5d42d0a947dcac184e0141d19bf871f51e774e363` |
| `packages/webpack/tests/plugin.test.ts` | `06d8d32f6065e203c7f87975f46c66ca984565fd0bdd964849fc421d3a04ad2d` |

| Previous case | Approved case | Review status |
| --- | --- | --- |
| `rc87-a2cc12f09d82bb91` | `rc87-a2cc12f09d82bb91` | unchanged |
| `rc87-2d99ea0e5a8248fe` | `rc87-95afc75a0d20ce37` | changed-and-renamed |
| `rc87-c3255a639bad7508` | `rc87-c3255a639bad7508` | changed |
| `rc87-34bf97d92ae3004c` | `rc87-34bf97d92ae3004c` | changed |
| `rc87-28031ac807ec5325` | `rc87-28031ac807ec5325` | unchanged |
| `rc87-3b0f9e4b3218c695` | `rc87-3b0f9e4b3218c695` | unchanged |
| `rc87-46f3c89f5237b1b9` | `rc87-46f3c89f5237b1b9` | unchanged |
| `rc87-c6f234a37661be00` | `rc87-a9210afde2b25995` | changed-and-renamed |
| `rc87-074e56c447b243c2` | `rc87-074e56c447b243c2` | unchanged |
| `rc87-fb0fd2ea320a28ed` | `rc87-fb0fd2ea320a28ed` | unchanged |
| `rc87-138d2a9846a509c5` | `rc87-138d2a9846a509c5` | unchanged |
| `rc87-de63cfc41ad8a597` | `rc87-de63cfc41ad8a597` | unchanged |
| `rc87-6c18481fc5cdfa31` | `rc87-6c18481fc5cdfa31` | changed |
| `rc87-692ac35eb7556a3f` | `rc87-692ac35eb7556a3f` | unchanged |
| `rc87-dd785f5a00080d1c` | `rc87-dd785f5a00080d1c` | changed |
| `rc87-82aab64164d5d4a8` | `rc87-5d560f8098718cfe` | changed-and-renamed |
| `rc87-0f080221ec60651a` | `rc87-3c3c79a9bd560910` | changed-and-renamed |
| `rc87-81017bda3a0a433d` | `rc87-81017bda3a0a433d` | unchanged |
| `rc87-90b45cbedb62f8ad` | `rc87-ac48cb8b3e2fe23a` | changed-and-renamed |
| `rc87-ce29f729c5b6ac32` | `rc87-ce29f729c5b6ac32` | unchanged |
| `rc87-f67818a2528723e4` | `rc87-f67818a2528723e4` | unchanged |

The decision source records the approved case digests and fresh scope digest. The upstream rc.87 baseline and post-rc.87 overlay stay fixed. No package publication, unrelated contract change, expected-output rewrite, CI waiver or issue closure is authorized by these approvals.
