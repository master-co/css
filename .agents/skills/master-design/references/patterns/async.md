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

## Model the uncertain middle

Separate not started, pending, completed, failed, cancelled and result unknown. A timeout can leave the remote result unknown even though the local request ended. Before repeating a consequential operation, offer a supported status check or explain the uncertainty. Do not manufacture a successful percentage to make waiting feel shorter.

For optimistic updates, keep enough information to restore the previous state when the operation fails. Explain a rollback near the affected item and avoid silently discarding edits made after the optimistic change. Use optimistic behavior only when its consequences and recovery suit the task.

Offline content may be cached or a local draft. Label freshness and actual persistence; an offline indicator does not itself provide synchronization. If retry is supported, make its scope explicit and prevent a stale callback from overwriting a newer operation.

## Acceptance scenario

Run a slow operation, repeat the trigger, change input before completion, cancel where supported, then test partial failure and retry. Check focus, announcements, reduced motion and the final stable state. See [feedback](../components/feedback.md) and [motion](../foundations/motion.md).

## Limit failure to its actual scope

Keep useful primary content when an optional region fails. Name the unavailable region, its retry and any stale information that remains. A failed recommendation panel need not replace an editable document with a page-wide error. Conversely, do not call a dependent action ready when its required data is unavailable.

Keep controls responsive during loading; replace only content whose identity is changing. Use determinate progress only with a meaningful measured total, never merely because waiting is long. Do not force a minimum spinner duration that delays a completed task. Test regional failure alongside editing, stale content, retry and unavailable enhancement. See [large collections](large-collections.md) for failed append behavior.
