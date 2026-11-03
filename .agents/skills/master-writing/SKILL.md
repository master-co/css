---
name: master-writing
description: Write, edit, translate and review first-party Master technical articles, keeping reader tasks, evidence, publication status and stable content ownership explicit. Product skills supply their own semantics, examples and export contracts.
---

# Master technical writing

Establish the reader's task, the article type, the requested scope and the current publication status. Read the owning product's writing skill or site instructions before changing its technical claims. Follow [style and editing](references/style.md) for structure, prose, headings and translation.

Use source and relevant tests for implemented behavior, official version-matched documentation for external APIs, and recorded measurements for performance claims. Preserve distinctions between build time, server rendering, browser execution and tooling. A diagram or existing article is not independent evidence of correctness.

Keep Guide articles organized around reader actions, Reference around precise contracts and Blog around a supported argument or announcement. Include prerequisites before actions, usable examples and the result readers can verify. Distinguish conceptual illustrations from measurements. Product-specific illustration requirements belong to the product adapter.

Preserve authorship, original publication dates, published slugs and explicit heading anchors. Organization Blog content belongs to master.co; product guides and generated reference content remain in the product repository. Drafts have no synthetic publication date and are excluded from production routes, indexes, feeds and exports. Do not describe fallback English as a completed translation.

Integrate the article through the existing content, metadata and export workflow. A content-only article does not need a custom page component. Import custom MDX components explicitly. Verify useful text equivalents for figures and interactive demonstrations, translated anchors and the affected rendered pages.

Render file and directory structures with `@master/internal-site/components/ExplorerView.astro`, as in the Monorepo guide's “One project, one workspace” section. Use its nested `items` instead of a plain-text code fence in the article. Generate search and portable Markdown trees from those same items; verify names, order and hierarchy alongside the rendered page.

For options, prompts, comparisons and other article surfaces, follow [document components](references/document-components.md). Check the current rendered consumer and its export adapter; a gallery example or successful build alone does not establish that an article uses the intended presentation.

Complete the authorized edit and report substantive changes and verification. Writing or reviewing an article alone does not authorize publication or messages to others.
