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

## Verify

Activate with keyboard and pointer, submit through the form's native mechanism, and retry after failure. Check long labels, focus rings, busy transitions, disabled behavior and first-touch discoverability. Master UI implementations: [Button](https://ui.master.co/components/button) and [Link](https://ui.master.co/components/link). Read their current contracts for supported classes and attributes.
