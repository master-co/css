# Master CSS documentation site

This workspace builds the public Master CSS documentation site. Install the repository dependencies first, then run site commands from the repository root with `bun run --filter site <script>`.

## Ownership

- `content/` owns pages and guide content; `routes.ts` maps them to URLs.
- `src/` owns the Astro route and document layout; `sections/` owns each section's shell.
- `islands/` hydrates `'use client'` React components.
- `docs-shell/` owns the documentation navigation, layouts, contexts, MDX rendering, and page factories.
- `components/`, `reference/`, and `utils/` own Master CSS-specific features.
- `styles/docs-shell/` and `public/` contain the shell's styles and required public assets.

The site owns its shell and dependency versions. The old root `internal` submodule is gone. `packages/internal` is a separate repository-private package used by the CSS packages.

## Development and checks

| Command | Purpose |
| --- | --- |
| `bun run --filter site dev` | Prepare generated data and start the Astro development server. |
| `bun run --filter site build` | Build the static site and verify public assets. |
| `bun run --filter site prepare-app` | Regenerate page categories and search data. |
| `bun run --filter site type-check` | Check TypeScript. |
| `bun run --filter site lint` | Run site lint rules. |
| `bun run --filter site test:islands` | Check client island rendering and serialization. |
| `bun run --filter site test:reference` | Check reference catalog and syntax behavior. |
| `bun run --filter site test:llms` | Check generated LLM documentation. |
| `bun run --filter site test:assets` | After a build, check that public images, icons, and fonts exist and are used. |

See [AI.md](./AI.md) for site architecture and authoring guidance.
