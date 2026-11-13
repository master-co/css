# Notifications and attention

Match interruption to consequence. A notification should help a person decide or act, not merely report every internal event.

## Choose the channel

| Scope and urgency | Useful channel | Avoid |
| --- | --- | --- |
| One field needs correction | Associated inline message | A distant toast with no field connection |
| A local action completed | Nearby status | An interruptive alert for routine success |
| An ongoing page-wide condition | Persistent banner | A message that expires before recovery |
| Information needed later | Activity history or inbox | Requiring people to remember a transient toast |
| A blocking decision | Dialog with clear choices | Modality for an update that needs no decision |

Status and alert semantics affect assistive-technology interruption as well as visual prominence. Use the least disruptive announcement that communicates the result. See [WCAG status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

## Control repetition

Aggregate related updates when each individual message would overwhelm the task. Keep the subject, time and action meaningful. A notification count should describe a real set with a review path, not a decorative badge.

Do not repeatedly announce a progress percentage or every search keystroke. Separate meaningful milestones from continuous visual progress. New notifications should not steal keyboard focus from ongoing work.

## Keep recovery available

A disappearing message must not contain the only way to recover valuable work. Keep failures and consequential undo available in the affected context or a durable history. If a timed message is appropriate, account for people who read or operate more slowly.

Let people control optional notification channels and frequency when the product supports them. Explain essential service messages separately. A muted channel must not silently disable a necessary in-product warning.

## Acceptance scenario

Trigger several routine completions, a local error and an account-wide interruption while typing. Confirm messages do not steal focus, repeated updates are restrained, and recovery survives the toast lifetime. Test keyboard access, reduced motion and a screen reader. See [feedback](../components/feedback.md) and [recovery](recovery.md).
