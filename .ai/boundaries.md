# AI Modification Boundaries

## Safe To Modify

These are generally safe when scoped to the task:

- Tests for the affected package
- New regression fixtures
- AI-facing docs and package-local `AI.md` files
- Public docs after verifying behavior from source/tests
- Examples that demonstrate intended behavior
- Package-local bug fixes with focused tests

## Modify With Caution

These require source tracing, focused tests, and clear explanation:

- Parser behavior
- Syntax rule definitions
- Rule priority and sorting
- Selector generation
- At-rule parsing/generation
- Variable and mode resolution
- Config extension and flattening
- Runtime hydration
- Native stylesheet insertion/deletion
- Static extraction heuristics
- Language-service class detection and completions
- ESLint autofix ranges
- Public API types and package exports
- Build plugin injection and virtual modules
- Generated CSS fixtures and snapshots

## Refactor Compatibility Boundary

When the requested work is a refactor, rewrite, cleanup, migration, or re-architecture, backward compatibility is not assumed. It is acceptable to remove old APIs, aliases, config forms, fixtures, compatibility branches, and transitional adapters when they conflict with the clean target design.

Those changes still sit in the caution zone. The implementation must identify the breaking surface, update tests and fixtures for the new behavior, and explain why the old behavior was removed. If the user or issue requires compatibility, treat that compatibility as an explicit contract and test it.

## Do Not Modify Unless Explicitly Requested

- `pnpm-lock.yaml`
- Package names
- Package manager config
- Release config and release workflows
- CI workflows
- License
- Changelog or release metadata
- Generated `dist` files
- Generated Nuxt/Vite/Site output
- Unrelated snapshots
- Broad formatting changes
- Submodule setup
- Package boundary direction

## Cycle Handling

When a change creates circular package pressure, do not patch around it with package-specific loaders or hidden runtime imports. Extract core domain contracts into `shared`, extract adapter-neutral build/framework module protocols into `@master/css-integration`, then add an explicit adapter in the package that owns the runtime behavior.

## CSS Output Rule

Any generated CSS change is a behavior change. Do not hide it in a refactor.
