# Master CSS documentation site

This workspace builds the public Master CSS documentation site. Install the repository dependencies first, then run site commands from the repository root with `pnpm --filter site <script>`.

## Ownership

- `app/` owns routes and guide content.
- `docs-shell/` owns the documentation navigation, layouts, contexts, MDX rendering, and page factories.
- `components/`, `reference/`, and `utils/` own Master CSS-specific features.
- `styles/docs-shell/` and `public/` contain the shell's styles and required public assets.

The site owns its shell and dependency versions. The old root `internal` submodule is gone. `packages/internal` is a separate repository-private package used by the CSS packages.

## Development and checks

| Command | Purpose |
| --- | --- |
| `pnpm --filter site dev` | Prepare generated data and start the development server. |
| `pnpm --filter site build` | Build the static site and verify public assets. |
| `pnpm --filter site prepare-app` | Regenerate page categories and search data. |
| `pnpm --filter site type-check` | Check TypeScript. |
| `pnpm --filter site lint` | Run site lint rules. |
| `pnpm --filter site test:reference` | Check reference catalog and syntax behavior. |
| `pnpm --filter site test:llms` | Check generated LLM documentation. |
| `pnpm --filter site test:assets` | After a build, check that public images, icons, and fonts exist and are used. |

See [AI.md](./AI.md) for site architecture and authoring guidance.
