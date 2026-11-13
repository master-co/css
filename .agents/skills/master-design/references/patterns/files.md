# Uploads and downloads

Treat file transfer as a task with identifiable items, constraints, progress and recoverable outcomes. Dragging is an enhancement; a keyboard-accessible file chooser must remain available.

## Before transfer

Explain accepted formats, size limits and quantity before selection. Keep the filename visible after selection and distinguish removing a queued file from deleting an existing uploaded file. Validate what can be checked locally without implying that client checks establish safety or server acceptance.

Show a useful correction for an unsupported file. Preserve other valid selections when one file fails. A drop target needs visible focus or a separate native chooser, and the same validation for every entry path.

## During transfer

Distinguish queued, transferring, processing, complete, failed and cancelled. Reaching the end of byte transfer may still require server processing. Do not label a file ready until the operation's actual completion condition is met.

Use measured progress only when the total is known. Show progress per item when that helps identify failures; a batch summary must agree with those items. Cancellation should explain whether completed files remain and whether the current partial transfer can resume.

## Recover a batch

Retry only failed or interrupted items unless the product explicitly needs a full restart. Keep successful items intact. Replacing a same-named file needs an explicit policy: names alone may not identify the same object.

If a download requires preparation, separate Preparing from Ready to download. An available link does not prove the browser saved the file to disk. State the file type and size when known, and explain an expired link's regeneration path.

## Acceptance scenario

Choose files by keyboard, include an invalid file, cancel one transfer and fail another after a third completes. Retry the failed item and verify successful work is not duplicated. For downloads, test preparation failure, retry and an expired link. Check announcements, long filenames, touch access and preserved focus. See [asynchronous work](async.md) and [feedback](../components/feedback.md).
