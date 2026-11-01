# Bring an external component into Master CSS

Choose one static HTML or JSX component and its styles. Keep the source available
as a baseline. Preserve content, interactions, accessibility, declaration order,
units, tokens and theme behavior. A requested redesign can deliberately change
those values; record it separately from the conversion.

For ordinary CSS, retain complex rules as native CSS. Use the
[declaration suggestion workflow](authoring.md#ask-for-class-suggestions) only
for isolated blocks after checking their selectors and cascade. A suggestion
checks those declarations; it cannot recover an omitted reset or inherited value.

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
   Declare the intended layer order before either generated stylesheet: creating
   `utilities` before `base` can let the reset override migrated styles. Retained
   source tokens must also keep their values when Master defines the same names.
4. Keep unresolved dynamic class expressions and plugin-dependent rules in place.
   Identify `tailwind-merge` or similar runtime class processing: it cannot process
   Master classes as if they were Tailwind. Preserve its existing path until its
   caller behavior is deliberately adapted and tested.
5. Compare the source and target in the intended host contexts at mobile and
   desktop widths, keyboard focus, hover, disabled, light/dark and reduced-motion
   states that apply. Check computed values and visual differences, not just
   whether both builds succeed. Keep the source baseline unchanged; applying the
   target reset to both pages can conceal a missing source dependency.

## Preserve the styles outside the utility list

Read matched rules as well as computed values on the component and its ancestors.
Check `html`, `body` and the nearest styled container for inherited font family,
font size, line-height and color. Inspect form-control font inheritance, box sizing,
default borders and margins when those elements occur. A text utility can supply
both font-size and line-height; a button without a text utility can still inherit
line-height through the source reset. Preserve the relevant dependency or scope
its source declarations to the imported component without resetting unrelated UI.

For example, if the source establishes unitless `line-height:1.5` but the target
host supplies `1.2`, retaining `font:inherit` alone keeps the wrong line-height.
A component-scoped `line-height:1.5` can restore the source behavior. Preserve the
unitless value rather than replacing it with one computed pixel measurement.

| Source evidence | Conversion decision |
| --- | --- |
| `height:calc(var(--spacing)*10)` | Keep the expression and its source token value. Master `h(10)` means 10px, not ten steps of the source spacing scale. |
| `font-size:1rem; line-height:1.5` | Preserve both declarations and their units. A matching font size alone does not preserve the line box. |
| Corrective CSS loses to a utility | Inspect the winning declaration and layer. Replace the conflicting utility or deliberately retain the source rule's precedence; an ID selector in `components` does not override a normal declaration in the later `utilities` layer. |

Keep shared source tokens distinct when the destination gives the same name a
different value. Do not globally overwrite a destination token merely to repair
one imported component, or fold a variable expression into a literal without
checking its theme and runtime dependencies.

## Preserve state changes, including timing

Inspect transition properties, duration, delay and easing as well as state colors.
An instantaneous source change must stay instantaneous unless redesign is requested;
adding a conventional 150ms transition changes behavior even when resting screenshots
match. Retain source transitions, animations and reduced-motion rules when present.

Compare entry and exit from hover, keyboard focus and disabled states, including
hover-to-focus and hover-to-disabled changes. For an existing transition, compare
the same elapsed points and its settled result; waiting until everything stops
does not verify timing. Check touch/tap behavior separately from mouse hover and
preserve the source hover-capability condition.

Do not copy an entire generated Tailwind stylesheet into a reusable component
without identifying its global reset and selector effects. During coexistence,
same-named classes can collide. Retain the source build until migrated surfaces
are verified; removing Tailwind is a separate project-wide decision.

`mastercss_css_compare` compares Master outputs and resolved project snapshots.
It does not interpret Tailwind classes or prove browser equivalence. Report the
converted portion, retained CSS, remaining source dependencies and performed
checks. Avoid unsupported percentage-of-conversion or fidelity claims.

For a repair after comparison, follow the
[evidence review](troubleshooting.md#verify-a-repair). Recheck final class recognition
separately from lint, preserve previously passing states, and report retained
dependencies and unresolved diagnostics from every relevant check.
