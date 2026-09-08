# 0043 Internal site-support content adaptation

- HEAD9bc565e512744e7fe6e4f28ae42fafa71f8b18ad, internal169b5ee6f8b4ca9817fa82eb572e105a24f78d80. README/coverage0042 read. Scope SUP-internal-workspace (distinct packages/internal checked0018).
- internal/package.json, site/AI and current reference maintenance read. Internal tests highlight-code/session, i18n-pathname, search-pages, word-mark transform plus source imports read; no local AI. No lint script. Tests target author-content→site highlighted/search/link representations. Pending baseline; source snapshot records externally committed changes.

## Results

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter internal test`:21 PASS exit0 ([log](../evidence/0043-internal.log)). HTML/TSX/CSS/plain class highlighting, native CSS/comments exclusion, indentation, split-token marks, default/custom/caller-owned session isolation, immutable returned trees, locale/suffix/external/asset path handling, MDX search text/anchors/localization checked.
- Source flow highlightCode→shared Shiki + Rust language sessions; content→Markdown AST→search records; localizePathname/canonicalize normalize site links. Caller-owned sessions remain usable and are disposed by test finally. No new finding. Real search UI covered later site browser; Firebase/external services untested. No package-local lint script.
- Submodule change belongs to other work; no edits in internal. Bounded content adaptation coverage complete.
