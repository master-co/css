# Site AI Instructions

These instructions apply to the `site/` workspace. They extend the repository root `AGENTS.md`; follow the root instructions first, then apply these site-specific rules. Keep this file named `AI.md`.

## Responsibility

The `site` workspace owns the public Master CSS documentation site, examples rendered inside docs, user-facing guide/message content, and site-specific visual demo implementation.

## Owns

- Public guide and message pages under `site/app/[locale]`.
- Documentation copy, code examples, generated CSS examples, and interactive demos.
- Site-local components, assets, dictionaries, category metadata, and docs verification scripts.
- Cloudflare/Next site build configuration.

## Does Not Own

- Core package behavior; verify behavior from source/tests before documenting it.
- Root-level public docs outside `site/` unless maintainers request them.
- Package-local AI instructions.
- Compiler, runtime, scanner, integration, or engine fixes unless explicitly requested as part of the same task.

## Key Files And Patterns

- Guide pages: `site/app/[locale]/guide/<slug>/{metadata.ts,page.tsx,content.mdx}` plus optional `components/`.
- Message pages: `site/app/[locale]/messages/<slug>/{metadata.ts,page.tsx,content.mdx}`.
- Example iframe pages: `site/app/[locale]/examples/<slug>/`.
- Demo images: `site/assets/images/<guide-or-feature>/`.
- Category data is generated; run `pnpm --filter site prepare-app` when adding or renaming pages.

## Risk Areas

- Docs drifting from source behavior.
- Generated CSS examples that do not match current engine/compiler output.
- Interactive demos that fail in the narrow doc content column.
- Token and visual choices that conflict with Design Foundations guidance.
- View Transition API examples with duplicate `view-transition-name` values or missing fallback behavior.
- Site type-check can have unrelated existing errors; do not hide new errors introduced by a change.

## Safe Changes

- Content-only docs updates verified against source/tests.
- Guide/message page additions using the established page shape.
- Local demo components that follow existing site primitives.
- Data-driven token overview tables using existing helpers.

## Dangerous Changes

- Documenting behavior from memory instead of source/tests.
- Creating a root `docs/` directory without request.
- Exposing framework-specific code in reader-facing examples unless the section is about that integration.
- Hard-coding preset token rows when they can be read from preset manifest data.
- Placing guide demo images in `site/public/` unless they need stable public URLs outside the bundle.

## Documentation Architecture

Guide pages live under:

```txt
site/app/[locale]/guide/<slug>/
```

Use this shape:

```txt
metadata.ts
page.tsx
content.mdx
components/
```

- `metadata.ts` defines public title, description, category, reference links, and `fileURL`.
- `page.tsx` uses `createPage`, `internal/layouts/doc`, `site/dictionaries`, and `site/.categories/guide.json`.
- `content.mdx` contains guide copy, code examples, generated CSS examples, and imported local demos.
- `components/` contains interactive demos and guide-local presentational components.

Message pages use the same file shape under `site/app/[locale]/messages/<slug>/`. Use them for console errors, warnings, diagnostics, and runtime/build messages that need user-facing explanation. Each message page should explain the exact or representative message, why it appears, the smallest fix, and when it can be ignored. When adding a new emitted error or warning, prefer a stable `/messages/<slug>` URL and add/update the matching page in the same change.

For the View Transitions guide: route slug is `/guide/view-transitions`, title is `View Transitions`, category is `Fundamentals`, and references to the platform feature should use `View Transition API`.

## Content Strategy

Use sentence case for public documentation headings in guide `content.mdx`: capitalize only the first word and proper nouns. Avoid title case such as `Root Options`; prefer `Root options`.

Guides should teach in this order:

1. Explain the native web feature in plain language with authoritative references such as MDN or web.dev.
2. Show the smallest Master CSS syntax needed.
3. Provide a working in-page demo.
4. Show generated CSS with `<Class2CSS>` when introducing new Master CSS classes.
5. Cover constraints, fallbacks, browser support, and accessibility after the core flow is clear.

Keep reduced-motion handling and progressive hardening after the primary example unless the guide is specifically about accessibility. For guide layout, visual design, responsive behavior, and token choices, inspect the current Design Foundations guide pages instead of duplicating their rules here.

## Example Code

Visible documentation examples should be as framework-neutral as practical:

- Prefer native `html`, `css`, and `js` blocks.
- Use `class`, not React `className`, in visible HTML examples.
- In `/guide` pages, prefer CSS scanner directives such as `@source`, `@source not`, `@safelist`, and `@blocklist` over JavaScript scanner options unless the section is specifically about integration configuration.
- Prefer shorthand Master CSS variable references such as `w:$size`, or native CSS references such as `w:var(--size)` when fallback values are needed.
- Use `document.startViewTransition()` with a direct DOM update and fallback in visible JavaScript examples.
- Avoid exposing Next.js, React state, `flushSync`, or `next/image` in visible examples unless the section is about that framework integration.
- Implementation demos may use React, Next.js, and `flushSync`; displayed code does not need to match exactly.
- In `content.mdx`, do not default-import guide-local components from relative `./components/*` modules. MDX injects default exports automatically; import only named exports from those modules to avoid duplicate component registration errors.

For View Transitions examples, keep `view-transition-name` values unique, prefer article-specific names such as `article-image`, use `view-transition-class` to group related snapshots, and avoid broad `::view-transition-group(*)` in shared demos unless intentionally documenting global behavior.

## Demo Implementation

Interactive demos should be local client components under the guide's `components/` folder. Use existing site primitives:

- Wrap demos in `<Demo>`.
- Use `next/image` for local bitmap images.
- Use `@tabler/icons-react` for icon buttons and icon+text controls when an appropriate icon exists.
- Use existing app button and panel classes where possible.

Design demos for the doc content column, not the viewport. A `<Demo>` inside guide content is roughly `674px` wide on desktop and narrower on mobile. Prefer container queries over viewport breakpoints, add `container` when using `@container(...)`, keep mobile single-column by default, and use two columns only when the container has room.

For View Transitions demos, add transition styling classes to `document.documentElement` in a client component and clean them up on unmount. In React state demos, wrap the update passed to `document.startViewTransition()` in `flushSync()` so the DOM update happens inside the transition callback. Always provide a no-API fallback.

For Layout System and similar foundation demos, prefer one polished practical UI composition over abstract placeholder grids when teaching product layout decisions. Use `<ResizeZone>` with `<IFrame>` for primary responsive demos when the lesson depends on viewport width. Keep iframe pages under `site/app/[locale]/examples/<slug>/`. Pair practical demos with reduced code samples that expose layout strategy, not every decorative class.

## Design References

Before changing guide demo layout, spacing, sizing, color, radius, typography, or responsive behavior, inspect the relevant Design Foundations guide pages and follow current patterns.

Follow the public Design Tokens policy when writing site code, demos, and examples:

- Prefer configured foundation tokens from `packages/preset/src/theme.css`.
- Prefer preset palette, surface, line, and text aliases such as `fg:blue-60`, `text:body`, `text:muted`, `text:blue`, `surface:base`, `bg:canvas`, `bg:blue`, `bg:blue-5`, and `b:1px|solid|base`.
- Use project semantic tokens such as `divider`, `accent`, or `danger` only when the page or project defines those tokens in `@theme`.
- Preserve typography semantics: use `font:<size>` for raw font-size-only replacements, and `text:<size>` only when the complete type treatment is intended.
- Prefer scale tokens such as `p:sm`, `gap:md`, and `mt:lg` over routine raw spacing, color, shadow, or timing values.
- Prefer contextual shorthand such as `b:1px|solid|base`, `b:1px|solid|muted`, `text:body`, and `transition:opacity|normal|standard` when the utility already resolves a namespace.
- Low-level values are acceptable when teaching syntax, no token exists, the value is local measured geometry, or the value is structural layout such as `w:50%`, `h:100dvh`, `m:0`, `m:1px`, `z:1`, or `opacity:.64`.
- Promote reused visual low-level values to named tokens.
- Use docs callout markers as regular text paragraphs: `(x)`, `(o)`, `(!)`, and `(i)`.

For numeric theme variable overview tables, read values from `site/utils/theme-variables` or a narrow derived helper. Render token, value, and reference unit columns; use `ThemeNumberVariableTable` for numeric spacing, radius, breakpoint, and container scales unless a guide needs a specialized table. Keep token overview tables data-driven and separate from generated CSS examples.

For shared foundation namespaces, follow the `/guide/spacing#namespace-for-spacing` pattern: render a namespace-consumer table that groups the utilities and native properties that can use that namespace. Prefer `NamespaceUtilityTable` with keys derived from `site/utils/manifest-utilities` so rows stay aligned with the preset manifest, engine native value namespaces, and built-in key aliases. Keep the group labels reader-facing and curated, but do not hand-author unsupported keys. Use a namespace-consumer table separately from token value tables: token tables explain available values, while namespace tables explain where those values can be used. Verify the namespace source in engine/preset data before documenting it.

## Assets

Local bitmap assets for demos belong under:

```txt
site/assets/images/<guide-or-feature>/
```

Import them statically and render with Next `<Image>`:

```tsx
import Image from 'next/image'
import articleImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
```

Use `placeholder="blur"` when static imports provide blur data. Set an appropriate `sizes` value for responsive images.

## Validation

Run site orchestration commands from the repository root (`/Users/aron/master/css`). Use `pnpm dev:site` for normal development, `pnpm dev:site:clean` when `.next` must be reset, and `pnpm build:site` for the full package-warmed site build. Only use `site/` as cwd for one-off local debugging.

For content-only guide updates, run:

```sh
pnpm --filter site prepare-app
```

For interactive or visual demo changes, additionally verify:

```sh
curl -I http://localhost:3000/guide/<slug>
```

Use Playwright screenshots for desktop and mobile when layout, images, responsive behavior, or animation demos change. If Playwright browser binaries are missing, install the required browser with `pnpm exec playwright install chromium`.

Broader site checks are available when relevant:

```sh
pnpm --filter site lint
pnpm --filter site type-check
pnpm build:site
```

`pnpm --filter site type-check` may have unrelated existing errors. Report those separately and do not hide new errors introduced by the current change.
