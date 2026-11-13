# Editing and saving

Make the relationship between the displayed draft and the saved version explicit. A person should know whether their work is changed, saving, saved, failed or in conflict, and what happens when they leave.

## Choose a save model

| Model | Useful when | Required explanation |
| --- | --- | --- |
| Explicit Save | Changes form a deliberate transaction | What is included; Cancel discards only the draft |
| Autosave | Frequent edits should persist continuously | Pending, confirmed and failed status; undo or history where appropriate |
| Apply immediately | Each setting is independently committed | Per-setting feedback and recovery after failure |

Do not combine these models without making their boundaries visible. A switch that appears immediate should not secretly wait for an unrelated Save button.

## Track the versions

Keep the last confirmed version separate from the current draft. If the person edits again while a request is pending, an older success must not mark the newer draft as saved. Match acknowledgements to the version that was submitted.

Show saving near the edited context without repeatedly interrupting input. A failed save retains the draft and a retry action. Offline status must not claim server persistence; explain whether local storage exists and its limitations.

## Resolve conflict

When another change makes the draft stale, explain which version is current and offer the supported recovery: review differences, reload, merge or deliberately overwrite. Do not silently replace newer work. Overwrite is consequential and must identify its scope.

Undo reverses a defined operation; Cancel abandons an uncommitted draft. A history view can provide lasting recovery when a transient notification is insufficient. Preserve selection and cursor position where practical during background acknowledgements.

## Leave deliberately

Warn at a boundary that would actually lose work, not on every navigation. State whether Save, Discard and Stay affect a local draft or a remote version. A browser's unload behavior has limitations; provide useful in-product navigation handling without promising guaranteed recovery.

## Acceptance scenario

Edit, start saving, edit again before acknowledgement, then fail the next save. Retry, introduce a version conflict, cancel a discard decision and complete it intentionally. Check that no stale acknowledgement clears newer changes and that focus returns to a useful place. See [asynchronous work](async.md), [recovery](recovery.md) and [content design](../foundations/content.md).
