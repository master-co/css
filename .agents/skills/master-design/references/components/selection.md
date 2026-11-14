# Selection

Choose a selection control by the decision it represents. A checkbox chooses independently; a radio group chooses one of several options; a switch changes a setting; a select compresses a list when space and scanning needs justify it.

## Match the choice

Use checkboxes when more than one option may apply, including an explicit mixed state for a parent selection where needed. Use radio buttons when comparing a small set of mutually exclusive choices benefits from seeing them together.

A switch usually applies a setting directly. If a form defers all changes until Save, make that workflow clear rather than implying immediate application. A segmented control fits a small, closely related set; it is not automatically a tablist. Tabs switch associated panels, while a group of filter choices follows its own selection semantics.

## Keep labels and state explicit

Make the label part of the target when native semantics permit. Explain a choice in nearby text rather than hiding necessary information in hover-only help. A selected state must remain identifiable when focused, hovered or disabled.

For large or searchable option sets, a combobox can help, but it requires complete keyboard, active-option and popup behavior. Do not replace a usable native select with a custom list solely for appearance.

## Handle group operations

“Select all” must state whether it affects visible results, the current page or the entire result set. Preserve selection intentionally when filters change; show a count and a way to clear it. Hidden selected items should not become a surprise when a bulk action runs.

## Compare control meanings

| Decision | Suitable starting point | Distinction |
| --- | --- | --- |
| Independent inclusion | Checkbox | Several choices may be true |
| One visible choice | Radio group | A group has one selected value |
| Immediate binary setting | Switch | The change normally applies directly |
| One choice from a long plain list | Native select | Compact presentation with platform behavior |
| Search a large option set | Combobox | Query, active option and committed value are separate |
| Switch related content panels | Tabs | Each tab identifies an associated panel |

Selection is a value; focus is an input destination. Arrowing through suggestions may change the active option without committing it. Do not announce a provisional option as the saved value before the interaction commits it. A mixed parent checkbox represents partial selection, not a third independent business value unless the task defines one.

## Verify

Test arrow-key radio navigation, Space activation, labels, mixed state, disabled options and long text. For custom options, verify focus and active selection separately. Master UI implementations: [Checkbox](https://ui.master.co/components/checkbox), [Radio](https://ui.master.co/components/radio), [Switch](https://ui.master.co/components/switch) and [Combobox](https://ui.master.co/components/combobox).

## Search, multiple values and hierarchy

Keep typed query, active suggestion and committed value separate. State whether the field accepts only known options or permits a new value. Empty results and failed lookup are different; retain committed choices on a failed query. Test Escape, slow responses and IME before accepting a suggestion. A usable native select is still preferable to an unnecessary custom combobox; consult [APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

Multiple selected tokens need explicit names and removal operations, useful focus after removal, and a readable count. Do not make Backspace silently remove a value while the person is editing a query. A tag's outline does not decide whether it is text, a filter button, a destination link or a removable value.

Use a nested disclosure list for ordinary grouped navigation; use a [tree widget](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) only when hierarchical selection/navigation warrants its complete keyboard contract. Exact and approximate adjustments follow the [value contract](forms.md#choose-the-value-contract). For related content panels, use [disclosure and panels](disclosure.md), not selection semantics based on appearance alone.
