# Master CSS Overview

Master CSS is a markup-driven CSS language and framework. It lets users write compact, native-CSS-like syntax in class attributes and turns those classes into real CSS rules.

Example:

```html
<h1 class="fg:indigo fg:red:hover font:32 font:40@sm font:heavy text:center">
    Hello World
</h1>
```

The same syntax can express declarations, selectors, states, media queries, container queries, modes, variables, functions, animations, and reusable components.

## Positioning

Master CSS is not just a utility preset. It is a CSS language engine plus framework packages:

- Core rule generation and config resolution
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

- Syntax is closer to CSS declarations, such as `font:24`, `fg:red`, `bg:blue:hover@sm`.
- Selectors and at-rules are first-class syntax suffixes.
- Runtime and progressive rendering are supported in addition to static extraction.
- Config defines utilities, variables, selector tokens, at tokens, functions, modes, and animations. Reusable project styles are static utilities in the `main` layer.

Compared with CSS-in-JS:

- Output is CSS rules, not component-scoped JavaScript style objects.
- Runtime mode observes DOM class names and updates a stylesheet.
- Static and server rendering can produce zero or reduced runtime CSS.

## Core Concepts

- Rule: An emitted CSS rule-like object with text and a key.
- Utility: A parsed Master CSS class that maps to CSS declarations, selectors, at-rules, mode, priority, and layer.
- Static utility: A fixed class from `config.utilities`, such as `block` or `hidden`.
- Variable: A config token that can be inlined or emitted as a CSS custom property.
- Mode: A conditional variable/style context such as `light` or `dark`.
- Main style: A semantic static utility emitted in the `main` layer.
- Selector token: A named selector suffix expression.
- At token: A named `@` suffix expression for media, container, supports, layer, starting-style, and screen conditions.

## Output Model

The core output uses cascade layers:

```txt
base
theme
preset
main
general
keyframes outside layers
```

The layer statement is declared by `packages/core/base.css`:

```css
@layer base, theme, preset, main, general;
```

Core-generated CSS emits layer blocks but does not dynamically add or process the layer statement. General utilities should override main project styles, theme variables support modes, preset sits above base, and keyframes are not wrapped in layers.
