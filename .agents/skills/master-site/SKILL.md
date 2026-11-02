---
name: master-site
description: Build and maintain first-party Master Astro sites using the shared site framework, content conventions, Svelte islands and design system. Use for site integration, documentation layouts and shared UI; product compiler semantics stay in their owning project.
---

# Master sites

Read the consuming repository's instructions, its `site.config.ts` and the affected content or adapter. Master owns the shared framework in `@master/internal-site`; the consumer owns product content, product semantics and homepage composition.

- Import components through explicit `@master/internal-site/components/*`, layouts through `layouts/*`, and styles through `styles/*`. Change the shared source in the Master repository when the behavior belongs to every site. Do not copy its implementation into a consumer.
- Ordinary articles have `content.mdx` and `metadata.ts`. The integration generates static MDX imports using the section's document configuration. Retain an explicit `page.astro` for specialized rendering. Dynamic routes enumerate through lightweight `params.ts`; enumeration must not import every page or compiler example.
- Use Astro for static structure and Svelte 5 runes for interactive islands. Shell controls hydrate with `client:load`; other interactive surfaces use `client:idle={{ timeout: 500 }}`. Animated figures observe their own visibility. Read the official Svelte guidance and run its autofixer for component changes.
- Read context through `siteOf(Astro)` or `getSite()`; keep render state request-local. Island props are serializable. Svelte snippets receive Astro slots as static markup.
- Shared styles are authored once with the current pinned Master CSS toolchain. Foundation, interface and document CSS have separate ordered asset boundaries. Keep product semantic highlighting and generated examples in product adapters; do not import compiler code into client components.
- Read `@master/internal-site/styles/system/DESIGN.md` from the installed package for the `ui-*` component and `--ui-*` material contracts. Use `master-design` when refining visual relationships.
- Publish real translations only where configured; preserve explicit anchors, source dates and canonical ownership. Organization articles live on master.co. A draft stays out of production routes, indexes, feeds and exports.
- Pin shared package versions. Update skills explicitly using the repository's `skills:sync` command and commit the generated files and lock manifest. Do not edit synchronized files in the consumer or change global skills.

Verify packed package consumers, Astro and Svelte types, affected routes, hydration, keyboard use, reduced motion, and both themes at desktop/mobile widths. A successful server response does not prove hydration or visual correctness. Report actual verification and remaining limitations.
