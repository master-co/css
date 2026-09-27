# Vite portable path QA supplement

## Approved scope

Aron explicitly approved the exact supplemental differences in response to Codex request `call_98L62yLnTibymoiBvJkHk6dj`, item 0, in task `01a0dbdd-0a03-7673-9933-a64a98fd1de5`. Recorded at `2026-09-27T17:49:25Z`. The review compares `8cccf0441` with `eba6c0879d4b457fb153ac196cf9a570cdd73a7f`. Review JSON SHA-256: `37f889d494d7ddff8a271a5c503bda98b06004ad5f6ce48702ce7925bfb090e4`; patch SHA-256: `a1e771c1b9b448ebe80bdc1efc2fccfcd02c611315783ed65020dd10aecd50d1`.

Two previously approved case bodies now compare watcher dependencies using Vite's normalized path representation. Native filesystem operations still use the same files, and CSS, diagnostics, recovery and dependency registration assertions remain. Existing contract approvals remain in Git history and the separate utility approval documents; this supplements their target bytes only.

| Case | Original source digest | Previous approved target | Updated target |
| --- | --- | --- | --- |
| rc87-054c879ed15dfa40 | 15d2a61f201c3b8f30ea44d3381803209e8ed5dd9f9953d45648c0c8fc2482c5 | 0fbeb5a085d057f1af467a81a7099024ceaa68b02f4a2095927fdc14651d4556 | 63103fb922d62f0e373dd714a61a4ed02cf74b65316cb69e838d35530b33de37 |
| rc87-48ff4814761d1c90 | c62fd9d5353d8b511ad24233e46b4cf160e758ea23c413735a73c3c1c911a7fe | 3a6d0130956c5c52141ffa81fd7b511cbbfc7beb1f085ede3d0ae87b2f3032ab | 508f6473ef88e3d56d375c771c446075ef4878df5d648a91ea80589cd41e681d |

## Manifest file supplement

The full `packages/vite/tests/plugins/manifest-virtual-module.test.ts` hash changes from `ed2e70cfd4b0095b6dd625c5d42d0a947dcac184e0141d19bf871f51e774e363` to `77148fe32f807138339ea30f94ba76b9f4815680475f88a768f54fc426e4e4a0`. Four cases use normalized Vite watcher/access paths and HMR event inputs; the temporary root expands Windows short names through native realpath. All assertions remain. The 21 Manifest case digests, original implementation provenance and other seven file hashes were reverified unchanged. Target and approval scope digests are refreshed only for this approved file.

Validation: the focused 20 + 148 Vite cases pass, the full suite passes 678/678, and Vite lint/type-check/build pass. VSCode staged tests pass 16/16 locally. Windows validation remains required; this approval does not waive CI, approve other migration cases, or authorize publication.
