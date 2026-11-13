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

## Choose the recovery mechanism

| Situation | Useful mechanism | Boundary |
| --- | --- | --- |
| Safe reversible change | Undo | Retain enough state and a lasting route when needed |
| Unsaved local edit | Save, discard or stay | Explain exactly which draft would be lost |
| Known failed operation | Retry | Preserve input and avoid repeating completed items |
| Unknown remote outcome | Check status | Do not claim that a timeout proves failure |
| Irreversible consequence | Specific confirmation | Identify object, scope and result before commitment |

Design the recovery before choosing its notification. If undo is available only for the latest batch, say so and preserve that batch until the next operation replaces it. A confirmation must offer a real exit; pressing Escape should not execute the destructive choice.

## Acceptance scenario

Cancel a destructive confirmation, complete a reversible action and undo it, fail a save and retry, then leave with unsaved changes. Check preserved data, truthful status, keyboard exit and focus return. See [overlays](../components/overlays.md) and [form flows](forms.md).
