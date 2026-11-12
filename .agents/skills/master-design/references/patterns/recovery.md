# Recovery and consequential actions

Help people understand consequences and recover without reconstructing their work. Prevention, confirmation, undo and retry serve different purposes.

## Prefer reversible outcomes

Use undo when an action can safely be reversed. Keep the recovery available long enough and in a place that remains discoverable; a brief toast should not be the only route to restore valuable data. A recycle-bin or history view may be more appropriate for lasting recovery.

Confirm an irreversible or unusually consequential action with the object, scope and outcome stated clearly. Use a specific action label. Do not add confirmation to every routine action, which teaches people to dismiss it without reading.

## Preserve work after failure

Keep entered values, selection and useful context when a request fails. Tell the person what did and did not happen. A timeout may leave the server result uncertain; verify status where possible before inviting a retry that could duplicate work.

If recovery requires a permission or service change, explain the next useful action without exposing implementation jargon. Keep support information tied to the affected operation.

## Place feedback appropriately

A field correction belongs near the field. An account-wide issue may require a persistent message. A blocking modal should be reserved for a decision that cannot proceed in context. Keep error and focus cues visible together.

## Acceptance scenario

Cancel a destructive confirmation, complete a reversible action and undo it, fail a save and retry, then leave with unsaved changes. Check preserved data, truthful status, keyboard exit and focus return. See [overlays](../components/overlays.md) and [form flows](forms.md).
