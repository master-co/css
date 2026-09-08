# 0039 Rust artifact/codegen/parity contracts

- HEAD9bc565e512744e7fe6e4f28ae42fafa71f8b18ad, internal169b5ee6f8b4ca9817fa82eb572e105a24f78d80. README/coverage0038 handoff read. Scope CRATE-xtask/SUP-parity.
- Root/xtask Cargo.toml, local AI, Rust routing, main/artifacts/codegen/parity/tests read. Tests use own temp artifacts; codegen --check and parity are non-writing validation. Actual cross-target execution stays blocked0006; no builds/staging/release writes. Pending results.

## Results

- `cargo test -p xtask`: 3 PASS, exit0 ([log](../evidence/0039-xtask-tests.log)). Atomic replacement leaves no temp files; SHA256 formatting/bytes; all8 platform metadata staging uses synthetic temp binaries, detects post-stage checksum changes/missing artifacts and cleans own temp. These are orchestration tests, not cross-platform binary execution.
- `cargo xtask codegen --check`: exit0 ([log](../evidence/0039-codegen.log)); `cargo xtask parity`: exit0 ([log](../evidence/0039-parity.log)). No generated target or evidence refresh. Compiler/engine corpus contracts checked; duplicate/missing evidence validation reviewed in parity.rs. No new finding. Scoped coverage complete; actual releases/remote artifact downloads untested intentionally.
