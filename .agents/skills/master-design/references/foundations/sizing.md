# Sizing and density

Density determines how much information a person can work with comfortably. Choose it for the task and input context, then apply related control sizes consistently.

## Separate three sizes

A control has a content size, a visible surface and an interaction target. A small icon does not require a small target. A large button does not require oversized text. Keep icon alignment, internal padding and target geometry independently understandable.

Use a few meaningful sizes across a family. A compact field, adjacent button and select should share a comfortable baseline and label rhythm. Do not generate arbitrary size variants without a demonstrated use.

## Adapt to input and content

Compact desktop tools can be dense while remaining keyboard accessible. Touch targets need room for imprecise input. Meet the [accessibility target-size requirements](../accessibility.md), and prefer comfortable touch bounds where space permits.

Choose among three adaptations: expand a target around a preserved visible mark, grow the related controls and row spacing together, or recompose the controls. A preserved mark is useful when retaining an approved compact design; coordinated growth is useful when larger text or input precision needs more visible room. Neither is a universal pointer rule. Keep neighboring targets separate. If an invisible extension would intercept another action, use the open axis, retain an already sufficient target, or give the composition more room. Recheck corner proportions, baseline alignment and focus clearance when visible dimensions change.

Content determines minimum space. Use minimum height with padding rather than a fixed height where labels can wrap. Avoid width assumptions based on one translated string, a single number of digits or a placeholder.

## Compare footprints

A visible 16px icon can sit inside a 44px target, while a nearby text label uses the project's normal size. These are specimen dimensions that explain three independent bounds: content, visible surface and interactive area. An invisible target extension is useful only when it does not intercept a neighboring control.

Density also changes how much a person must scan and scroll. A compact data table may support comparison; a long service form may benefit from more separation. Do not infer a person's preferred density solely from screen width. Input precision, task frequency and text growth all matter.

## Apply a density change coherently

Coordinate field padding, adjacent actions, row spacing and focus clearance. Preserve entered values and selection when a density control changes presentation. A label's line-height is not a substitute for a target's measured height.

Switch density with a long field value, an error message and a focused action. Confirm the information and behavior remain the same, targets do not overlap, and the tightest layout still accommodates the intended input methods.

## Review

Measure the rendered target, not just its declared CSS width; flex shrinking can reduce it. Check neighboring targets, focus rings and scroll clipping. Test long labels, zoom, touch and combined controls. If density makes the task fragile, change the composition or offer a justified density choice instead of hiding essential information.
