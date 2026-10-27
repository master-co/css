# Language contract corpora

`v2-language-corpus.json` is the executable language contract for the Rust engine
and compiler. Each case records its inputs and the exact CSS bytes and rule metadata
the current language produces. Run it with:

```sh
cargo xtask parity
```

Native and Wasm tests execute the same corpus. Do not regenerate expected output
simply to silence a failure; first identify which language contract changed.

`v2-tooling-workflows.json` is the shared corpus for CLI, editor, and MCP
inspection. It covers ambiguous names, known-invalid expanded declarations,
unknown native capabilities, deferred values, ordinary classes, and unresolved
conditions. Run the owning packages' `final-semantics.test.ts` suites; set
`MASTER_CSS_EVALUATION_REPORT` when running the MCP suite to save its actual tool
results outside the repository. These are reproducible tool evaluations, not a
comparison of model generation accuracy.
