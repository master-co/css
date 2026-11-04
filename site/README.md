# Master CSS documentation site

This workspace builds the public Master CSS documentation site. Install the repository dependencies first, then run site commands from the repository root with `bun run --filter site <script>`.

## Ownership

- `content/` owns product pages, guides, and examples; its directory structure determines page URLs.
- `site.config.ts` configures content, navigation, sections, styles, and export adapters.
- `@master/internal-site/astro` provides the Astro route and shared document shell, including navigation, layouts, MDX rendering, and page factories.
- Astro components render markup; interactive Svelte 5 components hydrate through Astro client directives.
- `components/`, `reference/`, `sections/`, `layouts/`, and `utils/` own product-specific features and composition.
- `styles/` and `public/` contain product styles and assets; shared styles and artwork come from `@master/internal-site`.

The shared shell is maintained in the Master repository and consumed as an exact published `@master/internal-site` version. Update shared implementation there, then validate and upgrade the consumer. `packages/internal` is a separate repository-private package used by the CSS packages.

## Development and checks

| Command | Purpose |
| --- | --- |
| `bun run --filter site dev` | Prepare generated data and start the Astro development server. |
| `bun run --filter site build` | Build the static site and verify public assets. |
| `bun run --filter site prepare-app` | Regenerate page categories and search data. |
| `bun run --filter site type-check` | Check Astro, Svelte, and TypeScript. |
| `bun run --filter site lint` | Run site lint rules. |
| `bun run --filter site test:reference` | Check reference catalog and syntax behavior. |
| `bun run --filter site test:llms` | Check generated LLM documentation. |
| `bun run --filter site test:assets` | After a build, check that public images, icons, and fonts exist and are used. |

See [AI.md](./AI.md) for site architecture and authoring guidance.
