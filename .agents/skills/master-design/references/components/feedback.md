# Feedback

Feedback answers what happened, what is happening and what the person can do next. Match its prominence and duration to the importance of the information.

## Choose the right channel

Use local feedback for a local result: field validation beside the field, copy confirmation beside the copy action and progress beside the item being processed. A persistent banner can communicate a wider condition. A toast suits brief supplementary confirmation, but should not be the only place to find a critical error or recovery action.

Use an alert only when the information deserves immediate interruption. Routine status updates should be announced more quietly. Repeated messages should not overwhelm the page or screen reader.

## Distinguish states

Loading is not empty. Empty means there is no content in the current context; failure means content could not be obtained. Give each state useful copy and an appropriate action. A filtered empty result should offer a way to change the criteria rather than imply the collection never contained anything.

Use determinate progress only when there is a real measurable total. Indeterminate progress communicates ongoing work without inventing a percentage. Preserve item identity as status changes and avoid layout shifts in labels.

## Make recovery available

Errors should explain the immediate problem and a practical next action. Retain user input, provide retry when meaningful and avoid blaming the person. A persistent error must remain discoverable after a short notification disappears.

## Match the message to the state

Keep one operation's identity through acknowledgement, progress and result. A message saying Saved must correspond to the submitted version, not merely to the newest visible text. A cancelled operation must distinguish completed work from work that never started.

Use persistent local feedback for a problem that remains actionable. A brief confirmation can be supplementary, but its disappearance must not remove the only retry or undo. Distinguish polite status from urgent alert behavior and avoid placing the same message in several live regions. See [notifications](../patterns/notifications.md).

## Verify

Test slow work, repeated input, partial completion, offline failure and retry. Check announcements, message lifetime, reduced motion and contrast. See [asynchronous work](../patterns/async.md) and [recovery](../patterns/recovery.md). Master UI includes [Alert](https://ui.master.co/components/alert), [Toast](https://ui.master.co/components/toast) and [Progress](https://ui.master.co/components/progress) implementations.
