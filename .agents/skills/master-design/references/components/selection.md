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
