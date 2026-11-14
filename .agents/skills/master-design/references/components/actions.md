# Actions

Use a button to act on the current task and a link to navigate to a destination. Their appearance can share a visual language; their semantics and behavior should remain distinct.

## Choose emphasis

Give the main action in a decision clear emphasis. Secondary actions remain available with less weight. Use destructive styling for consequences such as deletion, not for any negative answer. A quiet close or cancel action should not look destructive.

Write labels that name the result: “Save changes”, “Create project” or “Delete draft”. Add enough context to repeated row actions through visible or accessible labels. An icon-only action needs a meaningful name; a tooltip is supplementary and must not be the only accessible label.

## Define the states

Preserve the control's geometry across hover, pressed, focus, busy and disabled states. Keep focus distinguishable when the control is also pressed or selected. A toggle button exposes its pressed state; an ordinary action button does not pretend to be a toggle.

For asynchronous submission, prevent duplicate work, preserve the action's identity and show progress or a concise busy label. Decide whether the control remains focusable based on the interaction, and communicate why it is unavailable when that reason is not apparent. Do not use a visually disabled link that still navigates.

## Compose safely

Specify button type inside forms. A secondary button should not submit accidentally. Keep grouped actions close enough to read together but with nonoverlapping targets. Do not nest a button inside a link or another button.

## Choose the element before its appearance

| Intent | Semantic choice | Expected behavior |
| --- | --- | --- |
| Open a document | Link with a real destination | Browser history, modified clicks and open-in-new-tab |
| Save the current form | Submit button | Native form submission and validation path |
| Show or hide a region | Button with expanded state | Activation updates the named region |
| Keep a setting on or off | Appropriate toggle control | Persistent value exposed separately from focus |

A large promotional action can still be a link when it navigates. An action can be visually quiet while remaining a button. Styling does not change the semantic choice. A disabled-looking destination that remains clickable is a mismatch between appearance and behavior.

## Verify

Activate with keyboard and pointer, submit through the form's native mechanism, and retry after failure. Check long labels, focus rings, busy transitions, disabled behavior and first-touch discoverability. Master UI implementations: [Button](https://ui.master.co/components/button) and [Link](https://ui.master.co/components/link). Read their current contracts for supported classes and attributes.

## Compose action groups

A row of buttons can remain ordinary tab stops. Use a toolbar's composite keyboard model only for a related command collection that benefits from it; see [APG toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/). A menu is a command popup, not a role for any list of links.

A split action has two separately named operations: execute the primary command and open its alternatives. The arrow must not unexpectedly execute the primary action. Keep overflow commands discoverable at narrow widths and return focus after dismissal. If people need to compare every option, visible controls may be better than an overflow menu.

## Explain unavailable actions

| State | Contract |
| --- | --- |
| Hidden | Absent from interaction; use when irrelevant, not to conceal a necessary explanation |
| Native disabled | Browser suppresses activation and ordinary focus; disabled form controls are excluded from submission |
| ARIA disabled | Exposes unavailability but does not suppress events, remove focus or change form submission by itself |
| Read-only | Retains a value for reading/copying; only applicable controls support it; normally remains focusable and submitted |
| Busy | Work is pending, not confirmed; prevent duplicate consequential actions and communicate progress |

Use an adjacent reason when an unavailable action needs explanation. A disabled control's tooltip cannot be the only route. Native disabled controls are not universally absent from screen-reader reading. Test supported browser/AT behavior separately from tab focus. Check pointer, Enter/Space and form submission, including programmatic handlers. See [HTML disabled](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#enabling-and-disabling-form-controls:-the-disabled-attribute) and [ARIA disabled](https://www.w3.org/TR/wai-aria-1.2/#aria-disabled).
