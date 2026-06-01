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

When a change creates circular package pressure, do not patch around it with package-specific loaders or hidden runtime imports. Extract the common, dependency-free contract, config type, module protocol, or generic factory into `shared`, then add an explicit adapter in the package that owns the runtime behavior.

## CSS Output Rule

Any generated CSS change is a behavior change. Do not hide it in a refactor.
