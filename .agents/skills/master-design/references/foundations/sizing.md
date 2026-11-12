# Sizing and density

Density determines how much information a person can work with comfortably. Choose it for the task and input context, then apply related control sizes consistently.

## Separate three sizes

A control has a content size, a visible surface and an interaction target. A small icon does not require a small target. A large button does not require oversized text. Keep icon alignment, internal padding and target geometry independently understandable.

Use a few meaningful sizes across a family. A compact field, adjacent button and select should share a comfortable baseline and label rhythm. Do not generate arbitrary size variants without a demonstrated use.

## Adapt to input and content

Compact desktop tools can be dense while remaining keyboard accessible. Touch targets need room for imprecise input. Meet the [accessibility target-size requirements](../accessibility.md), and prefer comfortable touch bounds where space permits.

Content determines minimum space. Use minimum height with padding rather than a fixed height where labels can wrap. Avoid width assumptions based on one translated string, a single number of digits or a placeholder.

## Review

Measure the rendered target, not just its declared CSS width; flex shrinking can reduce it. Check neighboring targets, focus rings and scroll clipping. Test long labels, zoom, touch and combined controls. If density makes the task fragile, change the composition or offer a justified density choice instead of hiding essential information.
