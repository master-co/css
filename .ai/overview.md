# Master CSS Overview

Master CSS is a markup-driven CSS language and framework. It lets users write compact, native-CSS-like syntax in class attributes and turns those classes into real CSS rules.

Example:

```html
<h1 class="color:indigo color:red:hover font-size:2rem font-size:2.5rem@sm font-weight:700 text-align:center">
  Hello World
</h1>
```

The same syntax can express declarations, selectors, native conditions, scoped variables, animations, and reusable mixins.

## Positioning

Master CSS is not just a utility preset. It is a CSS language engine plus framework packages:

- Manifest-driven rule generation
- Runtime rendering in the browser
- Server pre-rendering
- Static extraction
- Framework integrations
- Language service and syntax highlighting
- ESLint validation and class ordering

## Differences

Compared with native CSS:

- Styles are authored in markup as syntax classes.
- The engine generates only required CSS.
- Rule ordering and layers are handled automatically.

Compared with Tailwind:

- Direct declarations use native property names, such as `font-size:1.5rem`, `color:red`, and `background:blue:hover@sm`.
- Selectors and conditions are first-class syntax suffixes.
- Runtime and progressive rendering are supported in addition to static rendering.
- CSS entries define theme tokens, native scoped overrides, custom media, mixins and managed keyframes. Native component rules use `@layer components`. Mixin contents provide reusable wrappers without a variant registry.

Compared with CSS-in-JS:

- Output is CSS rules, not component-scoped JavaScript style objects.
- Runtime mode observes DOM class names and updates a stylesheet.
- Static and server rendering can produce zero or reduced runtime CSS.

## Core Concepts

- Rule: An emitted CSS rule-like object with text and a key.
- Utility: A parsed markup class with declarations, selectors, conditions, priority and layer.
- Mixin: An ordered static recipe defined with `@mixin`, invoked by a recipe class or `@apply`. Optional `@contents` expands the caller's block or a definition fallback.
- Variable: A theme token emitted on demand, or unconditionally with `static`; `inline` substitutes its value in generated declarations.
- Theme: Native selectors and conditions determining custom-property values through the CSS cascade. Preset `@dark` and `@light` use system preferences.
- Component: A native class rule authored in `@layer components`.
- Selector suffix: Native selector syntax applied to a generated rule.
- At suffix: Native conditions, named custom media, `@apply(--name(...))`, or whole-class `@layer(...)` placement. Wrappers retain left-to-right nesting order.

## Output Model

The core output uses cascade layers:

```txt
theme
base
defaults
components
utilities
keyframes outside layers
```

The layer statement is declared by `packages/preset/src/base.css` and exposed through the `@master/css/base.css` facade entry:

```css
@layer theme, base, defaults, components, utilities;
```

Engine-generated CSS emits layer blocks but does not dynamically add or process the layer statement. Utilities override ordinary component declarations, theme tokens use `:root,:host` with native overrides outside `@theme`, defaults sit above base, and keyframes remain outside layers.
