# A complete form service

Review entry, correction, review, submission and completion as one task. The service should preserve work across recoverable failure and make the committed outcome distinguishable from a draft.

## Establish the task

Ask for a name and contact address with visible labels and useful autocomplete. Explain why the information is needed. Divide the flow into meaningful stages rather than giving each field a separate screen. A short coherent form may not need steps at all.

On attempted progression, show associated field errors and a useful summary when multiple corrections are required. Keep entered values. The review step shows what will be submitted and provides a route to change it without starting over.

## Submit and recover

Prevent duplicate submissions while the operation is pending. A simulated failure in a teaching example should be explicit, deterministic and local. Preserve the review data and offer retry. Do not mark success merely because an animation finished.

Completion identifies what happened and offers a useful next action. Returning to edit after completion starts a new draft; it must not silently mutate the completed record. Leaving with unsaved work offers a specific choice where the interface supports it.

## Acceptance walkthrough

1. Attempt to continue with two invalid fields. Use the error summary to reach a field and correct it.
2. Complete the remaining field, continue to review, return to edit and confirm values remain.
3. Submit with a simulated failure. Confirm a repeated trigger does not duplicate work and retry retains the same draft.
4. Complete successfully and identify the saved result. Start again only through an explicit action.
5. Repeat with Enter, autofill, paste, long labels and a narrow viewport. Check focus after step changes and meaningful announcements without repetition.

See [fields](../components/forms.md), [form flows](../patterns/forms.md), [content design](../foundations/content.md) and [recovery](../patterns/recovery.md).

## A changing branch

Compare a remembered date with an available appointment and an exact quantity. Change postal delivery to collection, review the active values, then return: the address draft is recoverable but excluded while inactive. Preserve invalid input through correction and retry. See [branching forms](../patterns/forms.md#preserve-work-through-changing-branches).
