# Form flows

A form should explain what is needed, preserve work and make completion easy to recognize. Design the whole sequence: entry, validation, submission, failure, correction and success.

## Organize the task

Group fields by the person's mental model, with concise headings and necessary instructions before the affected inputs. Ask only for information the task needs. Mark optional or required fields consistently and explain unusual constraints before entry.

Choose a single-page form when the task is short and coherent. Use steps when they reduce complexity or represent meaningful stages, while keeping progress and a route back clear. Returning to an earlier step must preserve entered data.

## Validate at a useful moment

Provide immediate feedback for a completed, locally checkable condition when it helps. Avoid an error on an untouched field or a password warning on every keystroke. On submission, show a summary for multiple issues and associate each message with its field.

Do not disable the only submit action without explaining what remains. Allow the form to reveal actionable validation when that is more understandable. Keep a busy submission from running twice, and preserve values after network or server errors.

## Complete and recover

Show a clear result and the next useful destination. If a save is partial, state which parts succeeded. If leaving would discard unsaved work, offer an explicit choice at that boundary; do not interrupt every navigation when there is nothing to lose.

## Carry a draft through the flow

Model entry, review, submitting, failed and completed as distinct states. Going Back from review returns to the same draft. Retry uses the retained values, while completion identifies a confirmed result. Editing after completion starts a new draft rather than silently changing the submitted record.

A review step is useful when consequences or multiple sections warrant checking. It is unnecessary friction for a trivial one-field task. If a flow has steps, make their names meaningful and show which are complete without claiming success merely because a panel was opened.

If a session expires or the network becomes unavailable, state whether work is local, queued or confirmed. Do not clear values on a failed request. A server-side field error belongs to its field even if the person is currently on review; provide a clear route to correction. See [access](access.md) and [editing](editing.md).

## Acceptance scenario

Enter data with autofill and keyboard, submit with two invalid fields, correct one, simulate a failed request, retry and complete. Confirm values survive, focus remains logical, messages are announced once and the final state is unambiguous. See [fields](../components/forms.md) and [feedback](../components/feedback.md).
