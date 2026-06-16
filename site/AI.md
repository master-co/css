# Site AI Instructions

These instructions apply to the `site/` workspace. They extend the repository root `AGENTS.md`; follow the root instructions first, then apply these site-specific rules.

Keep this file named `AI.md`. It is the scoped instruction file for agents working inside `site/`.

## Documentation Architecture

Guide pages live under:

```txt
site/app/[locale]/guide/<slug>/
```

Use the established page shape:

```txt
metadata.ts
page.tsx
content.mdx
components/
```

- `metadata.ts` defines the public title, description, category, reference links, and `fileURL`.
- `page.tsx` should use `createPage`, `internal/layouts/doc`, `site/dictionaries`, and `site/.categories/guide.json`.
- `content.mdx` contains the guide copy, code examples, generated CSS examples, and imported local demos.
- `components/` contains interactive demos and guide-local presentational components.
- Category membership comes from metadata. Run `pnpm --filter site prepare-app` when adding or renaming pages so local `.categories` files refresh.

Message pages live under:

```txt
site/app/[locale]/messages/<slug>/
```

Use message pages for console errors, warnings, diagnostics, and runtime/build messages that need user-facing explanation. Each new message page should follow the same `metadata.ts`, `page.tsx`, and `content.mdx` shape as existing messages, use category `Errors` or `Warnings`, and explain:

1. The exact message or representative message text.
2. Why it appears.
3. The smallest fix.
4. When it can be safely ignored, if applicable.

When adding a new error or warning in code, prefer including a stable `/messages/<slug>` URL in the emitted message and add or update the matching message page in the same change.

For the View Transitions guide specifically:

- Route slug is `/guide/view-transitions`.
- Page title is `View Transitions`.
- Category is `Fundamentals`.
- Use the formal platform feature name `View Transition API` when referring to the browser API.

## Content Strategy

Use sentence case for public documentation headings inside guide `content.mdx` files: capitalize the first word and proper nouns only. Avoid title case such as `Root Options`; prefer `Root options`.

Guides should teach in this order:

1. Explain the native web feature in plain language with links to authoritative references such as MDN or web.dev.
2. Show the smallest Master CSS syntax needed to use it.
3. Provide a working in-page demo.
4. Show generated CSS with `<Class2CSS>` when the guide introduces new Master CSS classes.
5. Cover important constraints, fallbacks, browser support concerns, and accessibility concerns after the core flow is clear.

Keep reduced-motion handling and other progressive hardening after the primary example unless the guide is specifically about accessibility.

For guide layout, visual design, responsive behavior, and token choices, use the existing `Design Foundations` category under `site/app/[locale]/guide` as the source of truth. Do not duplicate or enumerate those guide pages here; discover the relevant current pages from metadata or generated category data when needed.

## Example Code

Visible examples in documentation should be as framework-neutral as practical:

- Prefer native `html`, `css`, and `js` code blocks for the reader-facing examples.
- Use `class`, not React `className`, in visible HTML examples.
- In `/guide` pages, prefer CSS extractor directives such as `@source`, `@source not`, `@source required`, `@safelist`, and `@blocklist` over JavaScript `extractor` option examples when teaching source scanning, safelisting, or blocklisting. Use JS plugin options only when the section is specifically about integration configuration.
- Prefer shorthand Master CSS variable references such as `w:$size` over `w:$(size)` unless the example is intentionally teaching legacy syntax, function syntax, fallback behavior, or migration behavior.
- Use `document.startViewTransition()` with a direct DOM update and fallback in visible JavaScript examples.
- Avoid exposing Next.js, React state, `flushSync`, or `next/image` in visible examples unless the section is explicitly about a framework integration.
- The implementation demo may use React, Next.js, and `flushSync`; the displayed code does not need to match it exactly.

For View Transitions examples:

- Keep `view-transition-name` values unique among rendered elements.
- Use article-specific names such as `article-image` instead of generic names that can collide in a list.
- Use `view-transition-class` to group related snapshots when styling `::view-transition-group(...)`.
- Scope global transition pseudo-element classes carefully. Avoid broad `::view-transition-group(*)` in shared guide demos unless intentionally documenting global behavior.

## Demo Implementation

Interactive demos should be local client components under the guide's `components/` folder.

Use existing site primitives:

- Wrap demos in `<Demo>`.
- Use `next/image` for local bitmap images.
- Use `@tabler/icons-react` for icon buttons and icon+text controls when an appropriate icon exists.
- Use existing app button and panel classes where possible.

Design demos for the actual doc content width, not just viewport width:

- A `<Demo>` inside guide content is roughly `674px` wide on desktop and much narrower on mobile.
- Prefer container queries over viewport breakpoints for internal demo layout.
- Add `container` to the demo wrapper when using `@container(...)` classes.
- Keep mobile single-column by default.
- Use two-column layouts only when the container has enough width.
- Avoid layouts where text, buttons, or cards rely on wide desktop space that the doc article does not provide.

For View Transitions demos:

- Add transition styling classes to `document.documentElement` in a client component and clean them up on unmount.
- In React state demos, wrap the state update passed to `document.startViewTransition()` in `flushSync()` so the DOM update happens inside the transition callback.
- Always provide a no-API fallback that runs the update immediately.
- Keep article detail views single-column unless the guide explicitly demonstrates a multi-column destination layout.

For Layout System and similar foundation layout demos:

- Prefer one polished, practical UI composition over abstract placeholder grids when the guide is teaching product layout decisions. Good examples include app shells, dashboards, content with sidebars, media objects, card galleries, and editorial regions.
- Use `<ResizeZone>` with `<IFrame>` for the primary responsive demo when the lesson depends on viewport width, matching the responsive-design guide pattern. Keep the iframe page under `site/app/[locale]/examples/<slug>/`.
- Pair each practical demo with a reduced code sample that exposes the layout strategy, not every decorative class. Highlight containers, column counts, spans, gutters, breakpoint variants, and container-query variants.
- Use abstract boxes only for low-level anatomy such as explaining columns, gutters, line placement, or track sizing where real UI would obscure the concept.
- Keep layout examples token-aligned: container-scale shorthand such as `max-w:7xl` for wrappers, spacing tokens for gutters and margins, Grid for page regions, Flexbox for one-axis component layout, and `min-w:0` where flexible content can overflow.

For Design Foundations token overview tables:

- When a foundation guide introduces a numeric theme variable scale, include a theme variable overview near the top before usage sections.
- For new or optimized foundation token overview tables, read values from `site/utils/theme-variables` or a narrow derived helper, then render `Token`, `Value`, and a reference unit column.
- Show the full theme token name, such as `--spacing-md`, `--radius-lg`, `--breakpoint-md`, or `--container-md`; show the configured CSS token value in `Value`; and choose the reference column by the configured value: use `PX` when `Value` is already `rem`, otherwise show normalized `REM` using the site root size.
- Add a `Description` column only when short token usage guidance improves scanability. Keep descriptions concise and do not use them to duplicate adjacent prose or demos.
- Use `ThemeNumberVariableTable` from `site/components` for numeric spacing, radius, breakpoint, and container scales unless a guide needs a more specialized table.
- Keep these tables data-driven. Do not hard-code preset token rows in guide copy when they can be read from the preset plan.
- Use generated CSS examples separately from the theme variable overview. The overview teaches theme tokens; `<Class2CSS>` teaches emitted utility CSS.

## Design References

Before changing guide demo layout, spacing, sizing, color, radius, typography, or responsive behavior, inspect the relevant `Design Foundations` guide pages and follow their current patterns.

Follow the public [Design Tokens](/guide/design-tokens) policy when writing site code, demos, and examples:

- Use a token-first approach. Check `packages/preset/src/theme.css` and prefer configured foundation tokens before low-level values.
- Prefer semantic role tokens when available, such as `bg:base`, `bg:surface`, `fg:strong`, `fg:neutral`, line colors like `lightest` in border context, `primary`, `r:<token>`, `shadow:<token>`, `animation-duration:<token>`, and `animation-timing-function:<token>`.
- Preserve typography semantics: use `font:<size>` when replacing a raw font-size-only class like `font:40`, and use `text:<size>` only when the complete type treatment is intended because it can include font size, line height, and letter spacing.
- Prefer scale tokens for spacing and visual rhythm, such as `p:sm`, `gap:md`, and `mt:lg`, instead of routine `x`, `rem`, `px`, raw color, raw shadow, or raw timing values.
- Prefer contextual shorthand syntax when a utility already resolves a namespace, such as `b:1|lightest` instead of `b:1|line-lightest`, `fg:neutral` instead of `fg:text-neutral`, and `transition:opacity|fast|smooth` instead of `transition:opacity|duration-fast|easing-smooth`.
- Low-level values are acceptable when the page is teaching syntax, no token exists, the value is local measured geometry, or the value describes structural layout such as `w:1/2`, `h:100dvh`, `m:0`, `m:1`, `z:1`, or `opacity:.64`.
- If a low-level visual value is reused across product surfaces or examples, promote it to a named token instead of repeating it.
- Use the docs callout markers as regular text paragraphs, not code comments: `(x)` for incorrect examples, `(o)` for correct examples, `(!)` for warnings, and `(i)` for informational notes. Place them immediately before the relevant fenced code block or paragraph so the docs styling can transform them.

## Assets

Local bitmap assets for demos belong under:

```txt
site/assets/images/<guide-or-feature>/
```

Import them statically in components and render with Next `<Image>`:

```tsx
import Image from 'next/image'
import articleImage from '~/site/assets/images/view-transitions/article-aurora.jpg'
```

Use `placeholder="blur"` when static imports provide blur data. Set an appropriate `sizes` value for responsive images.

Do not place guide demo images in `site/public/` unless they must be addressed by a stable public URL outside the bundle.

## Verification

For content-only guide updates, at minimum run:

```sh
pnpm --filter site prepare-app
```

For interactive or visual demo changes, additionally verify:

```sh
curl -I http://localhost:3000/guide/<slug>
```

Use Playwright screenshots for desktop and mobile when layout, images, responsive behavior, or animation demos change. If Playwright browser binaries are missing, install the required browser with `pnpm exec playwright install chromium`.

`pnpm --filter site type-check` is useful, but this workspace may have unrelated existing type errors. Report those separately and do not hide new errors introduced by the current change.
