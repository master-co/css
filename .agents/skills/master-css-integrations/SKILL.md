---
name: master-css-integrations
description: "Write and maintain Master CSS framework and tool integration guides, create consistent Hero-material Master × partner covers, and integrate their light/dark artwork and social previews. Use for Integrations-category articles or their covers; exclude integration package implementation and explanatory technical diagrams."
---

# Master CSS integrations

Help a developer connect Master CSS to a framework or tool and verify the result. Give each integration a recognizable dual-brand cover using the homepage Hero's satin, polish and shallow relief.

## Choose the work

Read the affected article, its metadata and nearby page modules, and [site/AI.md](../../../site/AI.md). Preserve existing edits. Use the smallest mode that satisfies the request:

- **Write or substantially revise a guide:** use [master-css-writing](../master-css-writing/SKILL.md) for editorial methods and the integration-specific checks below. A new complete integration guide includes a cover. Retain an existing suitable cover for ordinary wording edits.
- **Create or refine a cover:** read [cover production](references/covers.md), inspect the actual Hero and the closest completed cover, then produce the requested assets. A cover-only task does not authorize rewriting the article.
- **Integrate existing artwork:** use [site integration](references/site-integration.md). Reuse suitable assets without regenerating them.

This skill owns Integrations-category writing and decorative covers. The top-level Installation guide remains with the general writing workflow. Integration guides stay code-first and do not need explanatory diagrams by default; covers do not replace technical evidence. Package behavior changes require their owning package's workflow.

## Write a usable integration

Use English unless another language is requested. Adapt the sequence to the framework rather than copying an unrelated guide's options.

1. Establish the supported framework/version and intended delivery mode from the checkout's integration source, package manifest, nearby tests and runnable example. Read the owning package's `AI.md` when investigating its behavior. Check external setup against version-matched official framework documentation; use the project's relevant framework MCP server.
2. State prerequisites, run the real installer or installation commands, and show the CSS entry plus the exact framework/configuration/import location. Preserve other plugins and integrations in examples. Prefer the public installer when it supports this framework; do not invent configuration or semantic fallbacks.
3. Give an observable development check and a separate production build/preview check. If relevant, verify styles with JavaScript disabled, on a direct route load, and after client navigation. Describe optional runtime/progressive modes only when implemented and verified; development success is not proof of production output.
4. Place actual limitations beside the affected setup or verification step. Preserve known limitations when polishing prose. Keep optional paths distinct from the primary setup and avoid unrelated framework internals.
5. Retain useful commands, configuration, code and live previews. Follow existing metadata, category, localization, search and Markdown ownership. Do not turn the decorative cover into tutorial text.

Validate changed examples through existing integration fixtures or relevant checks. Documentation work does not authorize repairing the integration implementation or expanding all guides.

## Complete the cover and delivery

Follow the cover reference for stable composition, formal logo inputs, built-in image generation, paired themes and retained provenance. Resolve routine optical balance and lighting decisions without adding an approval gate. Label a first example as a candidate until the user accepts its visual treatment; do not expand it into an unrequested batch.

Run the checks appropriate to the actual changes: skill validation and `bun run check:ai-context` for skill/context work; site lint and type-check for site changes; affected MDX, asset and example checks. Inspect the rendered result in both themes at 390, 768 and 1280px and at sharing-thumbnail scale. See the integration reference for theme, accessibility and metadata checks.

Deliver the skill location, artwork preview and source locations, substantive design choices, checks and remaining limitations. Keep pre-existing failures separate. Creation does not imply commit, push or publication.
