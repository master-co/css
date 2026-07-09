# CSS Output Pack

Use this when explaining, testing, or changing generated CSS.

## Core Invariants

- Layer order is `theme, base, defaults, components, utilities`.
- Generated layer blocks do not dynamically add the layer statement.
- Keyframes are emitted outside layers.
- Any CSS output difference is a behavior change.

## Trace

1. Start with the class string, manifest, and config.
2. Identify the matching manifest utility or native namespace.
3. Trace value parsing, variables, functions, selectors, modes, and conditions.
4. Check declarations, transforms, priority, and target layer.
5. Check final `css.text`.
6. If runtime, server, scanner, or language tooling is involved, trace that outer flow too.

## Escalate When

- Engine semantics are involved: read `.ai/data-flows.md`, `.ai/testing-policy.md`, and `packages/engine/AI.md`.
- Compiler/directive lowering is involved: read `packages/compiler/AI.md` and update `site/app/[locale]/guide/directives/content.mdx` if user-facing directive behavior changes.
- Static extraction, runtime hydration, language, or ESLint behavior sees the output: read those package `AI.md` files.

## Required Explanation

For any output change, state which classes or manifests changed, why the old output was wrong or incomplete, which tests or fixtures prove the new output, and whether runtime, static rendering, language service, ESLint, docs, or examples are affected.
