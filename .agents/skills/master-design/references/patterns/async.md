# Asynchronous work

Represent waiting, progress, partial completion, success and failure as distinct states of the same task. Keep the person's content and control context recognizable through the transition.

## Start honestly

Show immediate acknowledgement after activation. Use a local busy state when only one item is affected. A skeleton can reserve geometry for predictable content, but it should not imply a result that is not yet known. Avoid replacing an entire usable page with a spinner for a small update.

Use a measurable percentage only when the total is meaningful. Otherwise show that work continues without simulated precision. Prevent duplicate submissions while preserving a clear accessible state.

## Keep identity and ordering

Retain an item's name and position as it progresses unless sorting is an intentional product behavior. A changing status should not also silently change the object being described. Guard against stale responses and callbacks after a newer operation or cancellation.

If a batch partly succeeds, show the completed and failed items separately with a useful retry scope. Do not rerun completed destructive work because the overall operation failed.

## Finish with a next action

Success should be visible near the action and announced when it matters. Failures should preserve input and explain retry, correction or an alternative path. Offer cancellation when supported, and state whether completed work remains after cancelling.

## Acceptance scenario

Run a slow operation, repeat the trigger, change input before completion, cancel where supported, then test partial failure and retry. Check focus, announcements, reduced motion and the final stable state. See [feedback](../components/feedback.md) and [motion](../foundations/motion.md).
