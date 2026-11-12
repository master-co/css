# Design for the task. Refine every detail.

Master Design is a practical guide to building web interfaces that are clear, adaptable and carefully made. Start with the interaction and its purpose, establish the foundations, then refine the relationships people see and feel.

## Start with the right question

| What are you deciding? | Read |
| --- | --- |
| What matters in this interface? | [Design principles](principles.md) |
| Can everyone complete the task? | [Accessibility](accessibility.md) |
| How should content and controls relate? | [Typography](foundations/typography.md), [spacing](foundations/spacing.md) and [sizing](foundations/sizing.md) |
| Which control fits the job? | [Actions](components/actions.md), [forms](components/forms.md) and [selection](components/selection.md) |
| How does a complete flow work? | [Form flows](patterns/forms.md), [search](patterns/search.md) and [recovery](patterns/recovery.md) |
| Why does a detail feel wrong? | [Surface craft](surfaces.md), [geometry](geometry.md) and [evidence](evidence.md) |

## Principles before polish

A useful interface lets people recognize the next action, understand the current state and recover when something goes wrong. Its typography, spacing, color and motion make those relationships easier to understand. [Explore the principles](principles.md).

## Shared foundations, deliberate choices

The guidance works with an existing brand, framework and density. It does not prescribe one appearance for every product. Apply it through your project's established components, semantics and theme. The [Master UI library](https://ui.master.co) is one implementation; its design choices and APIs belong in its own documentation.

## Use the guide with an agent

Install the portable skill:

```sh
npx skills add master-co/design --skill master-design
```

Then describe the real task and its constraints:

```text
Use $master-design to review this form's hierarchy, error recovery and
keyboard behavior. Preserve the existing brand and implement the fixes.
```

The website and the installed skill read the same Markdown sources. The skill is self-contained: browsing this site, running its examples or installing its development tools is not required to use the guidance.

## Study the details

The craft references explain visible mechanisms: a contour against its background, a nested corner, an icon beside text, or feedback during an interrupted transition. Keep measurements, deductions and visual judgments separate. [Learn the verification method](evidence.md).

The [Interface Craft essays](https://aron.tw/en/blog/interface-craft) provide companion illustrations. Original research studies remain in the [Master Design repository](https://github.com/master-co/design/tree/main/examples/interface-craft).
