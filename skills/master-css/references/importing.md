# Bring an external component into Master CSS

Choose one static HTML or JSX component and its styles. Keep the source available
as a baseline. Preserve content, interactions, accessibility, declaration order,
units, tokens and theme behavior. A requested redesign can deliberately change
those values; record it separately from the conversion.

For ordinary CSS, retain complex rules as native CSS. Use class suggestions only
for isolated declaration blocks after checking their selectors and cascade.

## Tailwind source evidence

Read the source project's installed Tailwind version, entry stylesheet, theme,
plugins, custom variants and build command. Use that project's build to obtain
the CSS the component actually uses. If only a snippet is available and its
configuration is unknown, state the missing evidence and request the necessary
context; do not advertise a visually faithful conversion based on default names.

Read <https://rc.css.master.co/guide/migration/tailwindcss> for the current Master
workflow and the installed Tailwind version's official documentation for source
semantics. The default palettes, spacing scales and breakpoints differ.

1. Record source values and rule conditions from compiled CSS. Keep referenced
   variables, keyframes, reset dependencies and relative URL ownership intact.
2. Convert only straightforward declarations. Use explicit token references when
   available; preserve literal values otherwise. Keep relationships and complex
   rules in CSS, including required source selector classes.
3. Retain source rule scopes, importance and layer context deliberately. Tailwind
   v4 `hover:` includes `@media (hover: hover)`; a bare `:hover` loses that condition.
   Text utilities can include line-height as well as font-size.
   Declare the intended layer order before either generated stylesheet: creating
   `utilities` before `base` can let the reset override migrated styles. Retained
   source tokens must also keep their values when Master defines the same names.
4. Keep unresolved dynamic class expressions and plugin-dependent rules in place.
   Identify `tailwind-merge` or similar runtime class processing: it cannot process
   Master classes as if they were Tailwind. Preserve its existing path until its
   caller behavior is deliberately adapted and tested.
5. Compare the component at mobile and desktop widths, keyboard focus, hover,
   disabled, light/dark and reduced-motion states that apply. Check computed values
   and visual differences, not just whether both builds succeed.

Do not copy an entire generated Tailwind stylesheet into a reusable component
without identifying its global reset and selector effects. During coexistence,
same-named classes can collide. Retain the source build until migrated surfaces
are verified; removing Tailwind is a separate project-wide decision.

`mastercss_css_compare` compares Master outputs and resolved project snapshots.
It does not interpret Tailwind classes or prove browser equivalence. Report the
converted portion, retained CSS, remaining source dependencies and performed
checks. Avoid unsupported percentage-of-conversion or fidelity claims.
