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

## Acceptance scenario

Enter data with autofill and keyboard, submit with two invalid fields, correct one, simulate a failed request, retry and complete. Confirm values survive, focus remains logical, messages are announced once and the final state is unambiguous. See [fields](../components/forms.md) and [feedback](../components/feedback.md).
